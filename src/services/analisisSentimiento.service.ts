import { AppDataSource } from "../config/datasource";
import { AnalisisSentimiento } from "../entities/AnalisisSentimiento.entity";
import { DiarioEmocional } from "../entities/DiarioEmocional.entity";
import axios from "axios";

const analisisRepo = AppDataSource.getRepository(AnalisisSentimiento);
const diarioRepo = AppDataSource.getRepository(DiarioEmocional);

const SENTIMENT_SERVICE_URL = process.env.SENTIMENT_SERVICE_URL || "http://localhost:8000";
const SENTIMENT_TIMEOUT_MS = 90_000; // HF Spaces free tier can take 60-90s on cold start

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

      // Si el diario está pendiente/error significa que fue editado o falló antes — re-analizar
      if (existingAnalisis && diario.estado_analisis === "analizado") {
        console.log(`Entrada ${diarioId} ya fue analizada`);
        return existingAnalisis;
      }

      if (existingAnalisis) {
        await analisisRepo.remove(existingAnalisis);
      }

      console.log(`Analizando entrada ${diarioId}...`);

      const targetUrl = `${SENTIMENT_SERVICE_URL}/analyze/enhanced`;
      console.log(`📡 Llamando al servicio de sentimientos: ${targetUrl}`);

      const response = await axios.post<SentimentAnalysisResult>(
        targetUrl,
        {
          text: diario.texto_entrada,
          diario_id: diarioId,
        },
        {
          timeout: SENTIMENT_TIMEOUT_MS,
        }
      );

      const result = response.data;

      const sentimientoAmigable = SENTIMENT_MAP[result.sentimiento_general] || "equilibrado";

      const analisis = analisisRepo.create({
        diario_emocional_id: diarioId,
        paciente_id: diario.paciente_id,
        fecha_analisis: diario.fecha_entrada instanceof Date
          ? diario.fecha_entrada.toISOString().split("T")[0]
          : diario.fecha_entrada,
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
      const isAxiosError = error.isAxiosError;
      const status = error.response?.status;
      const code = error.code; // ECONNREFUSED, ETIMEDOUT, etc.
      console.error(
        `❌ Error analizando entrada ${diarioId}: ${error.message}` +
        (isAxiosError ? ` | URL: ${SENTIMENT_SERVICE_URL} | code: ${code} | status: ${status}` : "")
      );

      await diarioRepo.update(diarioId, { estado_analisis: "error" });

      return null;
    }
  }

  static async procesarPendientes(pacienteId: string): Promise<number> {
    try {
      const pendientes = await diarioRepo.find({
        where: [
          { paciente_id: pacienteId, estado_analisis: "pendiente" },
          { paciente_id: pacienteId, estado_analisis: "error" },
        ],
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
      const scorePositivo = typeof a.score_positivo === 'number' ? a.score_positivo : 0;
      const scoreNegativo = typeof a.score_negativo === 'number' ? a.score_negativo : 0;
      const score = scorePositivo - scoreNegativo;
      return acc + score;
    }, 0);

    const sentimientoPromedio = analisis.length > 0 ? sumScores / analisis.length : 0;

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

    const evolucionTemporal = analisis
      .map((a) => {
        const scorePositivo = typeof a.score_positivo === 'number' ? a.score_positivo : 0;
        const scoreNegativo = typeof a.score_negativo === 'number' ? a.score_negativo : 0;
        const score = scorePositivo - scoreNegativo;
        const confianza = typeof a.confianza === 'number' ? a.confianza : 0;

        return {
          fecha: a.fecha_analisis,
          sentimiento: a.sentimiento_general,
          score: score,
          emocion: a.emocion_predominante,
          confianza: confianza,
        };
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const insights: Array<{ type: string; text: string }> = [];

    // Insight sobre sentimiento promedio
    if (sentimientoPromedio >= 0.3) {
      insights.push({
        type: "positive",
        text: "El paciente presenta un estado emocional general positivo. Se recomienda reforzar las actividades y estrategias que están contribuyendo a su bienestar.",
      });
    } else if (sentimientoPromedio <= -0.3) {
      insights.push({
        type: "warning",
        text: "El paciente presenta un estado emocional negativo predominante. Se recomienda explorar los factores desencadenantes y evaluar ajustes en el plan terapéutico.",
      });
    }

    // Insight sobre tendencia
    if (evolucionTemporal.length >= 3) {
      const primerosScores = evolucionTemporal.slice(0, Math.min(3, Math.ceil(evolucionTemporal.length / 2)));
      const ultimosScores = evolucionTemporal.slice(-Math.min(3, Math.ceil(evolucionTemporal.length / 2)));

      const promedioInicial = primerosScores.reduce((sum, e) => sum + e.score, 0) / primerosScores.length;
      const promedioReciente = ultimosScores.reduce((sum, e) => sum + e.score, 0) / ultimosScores.length;

      if (promedioReciente > promedioInicial + 0.15) {
        insights.push({
          type: "positive",
          text: "Se observa una tendencia positiva en el estado emocional del paciente. El tratamiento actual parece estar generando resultados favorables.",
        });
      } else if (promedioReciente < promedioInicial - 0.15) {
        insights.push({
          type: "warning",
          text: "Se detecta un declive en el estado emocional del paciente. Se sugiere abordar este cambio en la próxima sesión y considerar intervenciones adicionales.",
        });
      }
    }

    // Insight sobre emoción predominante
    const emocionMasFrecuente = Object.entries(distribucionEmociones)
      .sort((a, b) => b[1] - a[1])[0];

    if (emocionMasFrecuente) {
      const [emocion, count] = emocionMasFrecuente;
      const porcentaje = (count / analisis.length) * 100;

      if (porcentaje >= 50) {
        const esNegativa = ["Ansioso", "Estresado", "Triste", "Molesto", "Frustrado"].includes(emocion);
        insights.push({
          type: esNegativa ? "warning" : "neutral",
          text: `La emoción "${emocion}" aparece en ${porcentaje.toFixed(0)}% de las entradas del paciente, sugiriendo un patrón emocional recurrente que puede requerir atención clínica.`,
        });
      }
    }

    return {
      total_entradas: analisis.length,
      sentimiento_promedio: sentimientoPromedio,
      distribucion_emociones: distribucionEmociones,
      palabras_clave: palabrasClave,
      alertas,
      evolucion_temporal: evolucionTemporal,
      insights,
    };
  }

  static async updateNotaValidacion(
    analisisId: string,
    nota: string | null
  ): Promise<AnalisisSentimiento | null> {
    try {
      const analisis = await analisisRepo.findOne({
        where: { id: analisisId },
      });

      if (!analisis) {
        throw new Error("Análisis no encontrado");
      }

      analisis.nota_validacion_psicologo = nota;
      await analisisRepo.save(analisis);

      return analisis;
    } catch (error: any) {
      console.error("Error actualizando nota de validación:", error.message);
      throw error;
    }
  }

  static async getAnalisisByDiarioId(diarioId: string): Promise<AnalisisSentimiento | null> {
    return await analisisRepo.findOne({
      where: { diario_emocional_id: diarioId },
    });
  }
}
