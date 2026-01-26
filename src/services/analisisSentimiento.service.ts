import { AppDataSource } from "../config/datasource";
import { AnalisisSentimiento } from "../entities/AnalisisSentimiento.entity";
import { DiarioEmocional } from "../entities/DiarioEmocional.entity";
import axios from "axios";

const analisisRepo = AppDataSource.getRepository(AnalisisSentimiento);
const diarioRepo = AppDataSource.getRepository(DiarioEmocional);

const SENTIMENT_SERVICE_URL = process.env.SENTIMENT_SERVICE_URL || "http://localhost:8000";

const SENTIMENT_MAP: Record<string, "esperanzador" | "desafiante" | "equilibrado"> = {
  "positivo": "esperanzador",
  "negativo": "desafiante",
  "neutral": "equilibrado",
};

interface SentimentAnalysisResult {
  sentimiento_general: string;
  score_positivo: number;
  score_negativo: number;
  score_neutral: number;
  confianza: number;
  modelo_usado: string;
  emocion_predominante: string;
  palabras_clave: Array<{ word: string; frequency: number }>;
  alertas: Array<{ type: string; text: string }>;
}

export class AnalisisSentimientoService {
  static async analizarEntrada(diarioId: string): Promise<AnalisisSentimiento | null> {
    try {
      const diario = await diarioRepo.findOne({
        where: { id: diarioId },
        relations: ["paciente"],
      });

      if (!diario) {
        console.error(`Entrada de diario no encontrada: ${diarioId}`);
        return null;
      }

      const existingAnalisis = await analisisRepo.findOne({
        where: { diario_emocional_id: diarioId },
      });

      if (existingAnalisis) {
        console.log(`Entrada ${diarioId} ya fue analizada`);
        return existingAnalisis;
      }

      console.log(`Analizando entrada ${diarioId}...`);

      const response = await axios.post<SentimentAnalysisResult>(
        `${SENTIMENT_SERVICE_URL}/analyze/enhanced`,
        {
          text: diario.texto_entrada,
          diario_id: diarioId,
        },
        {
          timeout: 30000,
        }
      );

      const result = response.data;

      const sentimientoAmigable = SENTIMENT_MAP[result.sentimiento_general] || "equilibrado";

      const analisis = analisisRepo.create({
        diario_emocional_id: diarioId,
        paciente_id: diario.paciente_id,
        fecha_analisis: diario.fecha_entrada,
        sentimiento_general: sentimientoAmigable,
        confianza: result.confianza,
        score_positivo: result.score_positivo,
        score_negativo: result.score_negativo,
        score_neutral: result.score_neutral,
        emocion_predominante: result.emocion_predominante,
        palabras_clave: result.palabras_clave,
        alertas: result.alertas,
        modelo_usado: result.modelo_usado,
      });

      await analisisRepo.save(analisis);

      await diarioRepo.update(diarioId, { estado_analisis: "analizado" });

      console.log(`✅ Análisis completado para entrada ${diarioId}`);

      return analisis;
    } catch (error: any) {
      console.error(`Error analizando entrada ${diarioId}:`, error.message);

      await diarioRepo.update(diarioId, { estado_analisis: "error" });

      return null;
    }
  }

  static async procesarPendientes(pacienteId: string): Promise<number> {
    try {
      const pendientes = await diarioRepo.find({
        where: {
          paciente_id: pacienteId,
          estado_analisis: "pendiente",
        },
        order: { fecha_entrada: "ASC" },
      });

      if (pendientes.length === 0) {
        console.log(`No hay entradas pendientes para paciente ${pacienteId}`);
        return 0;
      }

      console.log(`Procesando ${pendientes.length} entradas pendientes...`);

      let procesados = 0;

      for (const diario of pendientes) {
        const resultado = await this.analizarEntrada(diario.id);
        if (resultado) {
          procesados++;
        }
      }

      console.log(`✅ ${procesados}/${pendientes.length} entradas procesadas`);

      return procesados;
    } catch (error: any) {
      console.error("Error procesando entradas pendientes:", error.message);
      return 0;
    }
  }

  static async getAnalisisByPaciente(
    pacienteId: string,
    periodoDias: number = 30
  ): Promise<AnalisisSentimiento[]> {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - periodoDias);

    const analisis = await analisisRepo.find({
      where: {
        paciente_id: pacienteId,
      },
      order: { fecha_analisis: "DESC" },
    });

    return analisis.filter((a) => {
      const fechaAnalisis = new Date(a.fecha_analisis);
      return fechaAnalisis >= fechaInicio;
    });
  }

  static async getAnalisisAgregado(pacienteId: string, periodoDias: number = 30) {
    const analisis = await this.getAnalisisByPaciente(pacienteId, periodoDias);

    if (analisis.length === 0) {
      return {
        total_entradas: 0,
        sentimiento_promedio: null,
        distribucion_emociones: {},
        palabras_clave: [],
        alertas: [],
        evolucion_temporal: [],
      };
    }

    const distribucionEmociones: Record<string, number> = {};
    analisis.forEach((a) => {
      if (a.emocion_predominante) {
        distribucionEmociones[a.emocion_predominante] =
          (distribucionEmociones[a.emocion_predominante] || 0) + 1;
      }
    });

    const sumScores = analisis.reduce((acc, a) => {
      const score =
        a.sentimiento_general === "esperanzador"
          ? a.confianza
          : a.sentimiento_general === "desafiante"
          ? -a.confianza
          : 0;
      return acc + score;
    }, 0);

    const sentimientoPromedio = sumScores / analisis.length;

    const palabrasClaveTotales: Record<string, number> = {};
    analisis.forEach((a) => {
      if (a.palabras_clave) {
        a.palabras_clave.forEach((kw) => {
          palabrasClaveTotales[kw.word] =
            (palabrasClaveTotales[kw.word] || 0) + kw.frequency;
        });
      }
    });

    const palabrasClave = Object.entries(palabrasClaveTotales)
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const alertas = analisis
      .filter((a) => a.alertas && a.alertas.length > 0)
      .flatMap((a) => a.alertas || []);

    const evolucionTemporal = analisis.map((a) => ({
      fecha: a.fecha_analisis,
      sentimiento: a.sentimiento_general,
      score:
        a.sentimiento_general === "esperanzador"
          ? a.confianza
          : a.sentimiento_general === "desafiante"
          ? -a.confianza
          : 0,
      emocion: a.emocion_predominante,
      confianza: a.confianza,
    }));

    return {
      total_entradas: analisis.length,
      sentimiento_promedio: sentimientoPromedio,
      distribucion_emociones: distribucionEmociones,
      palabras_clave: palabrasClave,
      alertas,
      evolucion_temporal: evolucionTemporal,
    };
  }
}
