import { AppDataSource } from "../config/datasource";
import { DiarioEmocional } from "../entities/DiarioEmocional.entity";
import { AnalisisSentimiento } from "../entities/AnalisisSentimiento.entity";
import { EmocionTipo, MensajeDiarioOutput } from "../types/mensajesDiarios.types";

// Mensajes genéricos para sentimiento "desafiante"
const MENSAJES_DESAFIANTE: string[] = [
  "Mañana es un nuevo día.",
  "Has superado momentos difíciles antes.",
  "Date el tiempo que necesites.",
  "Una cosa a la vez.",
  "Este momento también pasará.",
  "Estás haciendo lo mejor que puedes.",
  "Está bien tomarte un respiro.",
];

// Mensajes específicos por emoción predominante
const MENSAJES_POR_EMOCION: Record<string, string[]> = {
  tristeza: [
    "Mañana es un nuevo día.",
    "Has superado días difíciles antes.",
    "Date el tiempo que necesites.",
    "Está bien sentirse así.",
  ],
  ansiedad: [
    "Respira profundo.",
    "Una cosa a la vez.",
    "Este sentimiento pasará.",
    "Estás aquí, estás bien.",
  ],
  enojo: [
    "Date espacio para procesar.",
    "Es válido lo que sientes.",
    "Está bien tomarte un respiro.",
  ],
  miedo: [
    "Has enfrentado miedos antes.",
    "Estás más fuerte de lo que crees.",
    "Este momento pasará.",
  ],
  soledad: [
    "Este momento también pasará.",
    "Has estado aquí antes y has salido adelante.",
  ],
  frustración: [
    "A veces las cosas toman tiempo.",
    "Has logrado mucho más de lo que crees.",
    "Está bien pausar cuando lo necesites.",
  ],
  preocupación: [
    "Una cosa a la vez.",
    "Enfócate en lo que está en tus manos.",
  ],
};

export class MensajesDiariosService {
  private diarioRepo = AppDataSource.getRepository(DiarioEmocional);
  private analisisRepo = AppDataSource.getRepository(AnalisisSentimiento);

  /**
   * Obtener mensaje del día para un paciente
   * Solo genera mensaje si hay una entrada de diario HOY y el sentimiento es negativo
   */
  async getMensajeDia(pacienteId: string): Promise<MensajeDiarioOutput | null> {
    try {
      // Obtener fecha de hoy (inicio y fin del día)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      // Buscar entrada de diario de hoy
      const entradaHoy = await this.diarioRepo.findOne({
        where: {
          paciente_id: pacienteId,
          fecha_entrada: hoy as any,
        },
      });

      if (!entradaHoy) {
        return null; // No hay entrada hoy
      }

      // Buscar análisis de sentimiento de hoy
      const analisisHoy = await this.analisisRepo.findOne({
        where: {
          paciente_id: pacienteId,
          fecha_analisis: hoy as any,
        },
      });

      // Si no hay análisis, no mostrar mensaje
      if (!analisisHoy) {
        return null;
      }

      // Solo mostrar mensaje si el sentimiento es "desafiante"
      if (analisisHoy.sentimiento_general !== "desafiante") {
        return null;
      }

      // Determinar tipo de emoción basado en emocion_predominante
      let tipoEmocion: string | null = null;
      const emocionPredominante = analisisHoy.emocion_predominante;

      if (emocionPredominante) {
        const emocionLower = emocionPredominante.toLowerCase();

        if (emocionLower.includes("triste") || emocionLower.includes("deprim")) {
          tipoEmocion = "tristeza";
        } else if (emocionLower.includes("ansie") || emocionLower.includes("nervios")) {
          tipoEmocion = "ansiedad";
        } else if (emocionLower.includes("enoj") || emocionLower.includes("ira") || emocionLower.includes("rabia")) {
          tipoEmocion = "enojo";
        } else if (emocionLower.includes("mied") || emocionLower.includes("temor") || emocionLower.includes("pánico")) {
          tipoEmocion = "miedo";
        } else if (emocionLower.includes("sol") || emocionLower.includes("abandon")) {
          tipoEmocion = "soledad";
        } else if (emocionLower.includes("frustr")) {
          tipoEmocion = "frustración";
        } else if (emocionLower.includes("preocup")) {
          tipoEmocion = "preocupación";
        }
      }

      // Obtener mensajes según la emoción o usar genéricos
      let mensajes: string[];
      if (tipoEmocion && MENSAJES_POR_EMOCION[tipoEmocion]) {
        mensajes = MENSAJES_POR_EMOCION[tipoEmocion];
      } else {
        // Usar mensajes genéricos para sentimiento desafiante
        mensajes = MENSAJES_DESAFIANTE;
      }

      // Seleccionar mensaje aleatorio (determinístico por día)
      // Usar fecha como semilla para que sea el mismo mensaje todo el día
      const seed = hoy.getDate() + hoy.getMonth() * 31 + pacienteId.charCodeAt(0);
      const index = seed % mensajes.length;
      const mensaje = mensajes[index];

      return {
        id: `${pacienteId}-${hoy.toISOString().split("T")[0]}`,
        paciente_id: pacienteId,
        fecha: hoy,
        emocion_detectada: tipoEmocion || "desafiante",
        mensaje,
        created_at: new Date(),
      };
    } catch (error) {
      console.error("Error al obtener mensaje del día:", error);
      return null;
    }
  }
}
