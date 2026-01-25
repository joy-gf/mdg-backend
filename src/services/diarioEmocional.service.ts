import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { DiarioEmocional } from "../entities/DiarioEmocional.entity";
import { AppDataSource } from "../config/datasource";

interface CreateDiarioInput {
  paciente_id: string;
  fecha_entrada: Date | string;
  emocion_seleccionada: string;
  texto_entrada: string;
}

interface GetEntriesFilters {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
}

export class DiarioEmocionalService {
  private static repo = AppDataSource.getRepository(DiarioEmocional);

  static async create(data: CreateDiarioInput) {
    if (!data.paciente_id) {
      throw {
        status: 400,
        code: "PACIENTE_ID_REQUERIDO",
        message: "El ID del paciente es requerido",
      };
    }

    if (!data.texto_entrada) {
      throw {
        status: 400,
        code: "TEXTO_REQUERIDO",
        message: "El texto de la entrada es requerido",
      };
    }

    const entrada = this.repo.create({
      paciente_id: data.paciente_id,
      fecha_entrada: data.fecha_entrada,
      emocion_seleccionada: data.emocion_seleccionada,
      texto_entrada: data.texto_entrada,
    });

    return this.repo.save(entrada);
  }

  /**
   * Get all entries for a patient
   *
   * @param paciente_id - Patient ID
   * @param filters - Optional date range filters
   * @returns Array of diary entries
   */
  static async getByPaciente(paciente_id: string, filters?: GetEntriesFilters) {
    const where: any = { paciente_id };

    // Apply date filters if provided
    if (filters?.desde && filters?.hasta) {
      where.fecha_entrada = Between(filters.desde, filters.hasta);
    } else if (filters?.desde) {
      where.fecha_entrada = MoreThanOrEqual(filters.desde);
    } else if (filters?.hasta) {
      where.fecha_entrada = LessThanOrEqual(filters.hasta);
    }

    return this.repo.find({
      where,
      order: { fecha_entrada: "DESC", created_at: "DESC" },
    });
  }

  /**
   * Get a single entry by ID
   * Validates that the entry belongs to the specified patient (security)
   *
   * @param id - Entry ID
   * @param paciente_id - Patient ID (for validation)
   * @returns Diary entry or null
   */
  static async getById(id: string, paciente_id: string) {
    const entry = await this.repo.findOne({
      where: { id, paciente_id }, // Security: ensure patient owns this entry
    });

    if (!entry) {
      throw {
        status: 404,
        code: "ENTRADA_NO_ENCONTRADA",
        message: "Entrada no encontrada o no pertenece al paciente",
      };
    }

    return entry;
  }

  /**
   * Actualizar entrada del diario emocional
   *
   * @param id - Entry ID
   * @param paciente_id - Patient ID (for validation)
   * @param data - Updated data
   * @returns Updated entry
   */
  static async update(
    id: string,
    paciente_id: string,
    data: Partial<CreateDiarioInput>
  ) {
    const entry = await this.repo.findOne({
      where: { id, paciente_id },
    });

    if (!entry) {
      throw {
        status: 404,
        code: "ENTRADA_NO_ENCONTRADA",
        message: "Entrada no encontrada o no pertenece al paciente",
      };
    }

    if (data.emocion_seleccionada !== undefined) {
      entry.emocion_seleccionada = data.emocion_seleccionada;
    }
    if (data.texto_entrada !== undefined) {
      entry.texto_entrada = data.texto_entrada;
    }

    return this.repo.save(entry);
  }

  /**
   * Get entry count for a patient
   *
   * @param paciente_id - Patient ID
   * @returns Entry count
   */
  static async getCountByPaciente(paciente_id: string): Promise<number> {
    return this.repo.count({ where: { paciente_id } });
  }
}
