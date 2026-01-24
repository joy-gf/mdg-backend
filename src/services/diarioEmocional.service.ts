import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { DiarioEmocional } from "../entities/DiarioEmocional.entity";
import { AppDataSource } from "../config/datasource";
import { decryptText, getEncryptionKey } from "../utils/crypto.util";

interface CreateDiarioInput {
  paciente_id: string;
  fecha_entrada: Date | string;
  emocion_seleccionada: string;
  texto_entrada_encrypted: string; // JSON string: { iv, ciphertext }
}

interface GetEntriesFilters {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
}

export class DiarioEmocionalService {
  private static repo = AppDataSource.getRepository(DiarioEmocional);

  /**
   * Create a new diary entry
   * Text is stored encrypted, but temporarily decrypted for ML analysis
   *
   * @param data - Entry data with encrypted text
   * @returns Created entry (with encrypted text)
   */
  static async create(data: CreateDiarioInput) {
    // Validaciones básicas
    if (!data.paciente_id) {
      throw {
        status: 400,
        code: "PACIENTE_ID_REQUERIDO",
        message: "El ID del paciente es requerido",
      };
    }

    if (!data.texto_entrada_encrypted) {
      throw {
        status: 400,
        code: "TEXTO_REQUERIDO",
        message: "El texto de la entrada es requerido",
      };
    }

    // Crear entrada
    const entrada = this.repo.create({
      paciente_id: data.paciente_id,
      fecha_entrada: new Date(data.fecha_entrada),
      emocion_seleccionada: data.emocion_seleccionada,
      texto_entrada_encrypted: data.texto_entrada_encrypted,
    });

    return this.repo.save(entrada);
  }

  /**
   * Get all entries for a patient
   * Returns encrypted entries (frontend will decrypt)
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
   * Decrypt entry text for ML analysis (temporary, in-memory only)
   * NEVER store the decrypted text in database
   *
   * @param encrypted_payload - JSON string with { iv, ciphertext }
   * @returns Decrypted plaintext
   */
  static decryptForAnalysis(encrypted_payload: string): string {
    try {
      const payload = JSON.parse(encrypted_payload);
      const key = getEncryptionKey();
      return decryptText(payload, key);
    } catch (error) {
      console.error("Error decrypting text:", error);
      throw {
        status: 500,
        code: "ERROR_DESENCRIPTACION",
        message: "No se pudo desencriptar el texto para análisis",
      };
    }
  }

  /**
   * Actualizar data existente solo para la entrada del día actual
   *
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

    const today = new Date().toISOString().split("T")[0];
    const entryDate = new Date(entry.fecha_entrada).toISOString().split("T")[0];

    if (entryDate !== today) {
      throw {
        status: 403,
        code: "ENTRADA_NO_ACTUALIZABLE",
        message: "Solo se pueden actualizar entradas del día actual",
      };
    }

    if (data.emocion_seleccionada !== undefined) {
      entry.emocion_seleccionada = data.emocion_seleccionada;
    }
    if (data.texto_entrada_encrypted !== undefined) {
      entry.texto_entrada_encrypted = data.texto_entrada_encrypted;
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
