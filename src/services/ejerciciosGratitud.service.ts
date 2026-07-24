import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { EjerciciosGratitud } from "../entities/EjerciciosGratitud.entity";
import { AppDataSource } from "../config/datasource";

interface CreateEjerciciosGratitudInput {
  paciente_id: string;
  fecha_entrada: Date | string;
  cosas_buenas: string;
  personas_agradecidas: string;
  aprendizaje_crecimiento: string;
  aspectos_valorados: string;
}

interface GetEntriesFilters {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
}

export class EjerciciosGratitudService {
  private static repo = AppDataSource.getRepository(EjerciciosGratitud);

  static async create(data: CreateEjerciciosGratitudInput) {
    if (!data.paciente_id) {
      throw {
        status: 400,
        code: "PACIENTE_ID_REQUERIDO",
        message: "El ID del paciente es requerido",
      };
    }

    const entrada = this.repo.create({
      paciente_id: data.paciente_id,
      fecha_entrada: data.fecha_entrada,
      cosas_buenas: data.cosas_buenas || "",
      personas_agradecidas: data.personas_agradecidas || "",
      aprendizaje_crecimiento: data.aprendizaje_crecimiento || "",
      aspectos_valorados: data.aspectos_valorados || "",
    });

    return await this.repo.save(entrada);
  }

  static async getByPaciente(paciente_id: string, filters?: GetEntriesFilters) {
    const where: any = { paciente_id };

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

  static async getById(id: string, paciente_id: string) {
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

    return entry;
  }

  static async update(
    id: string,
    paciente_id: string,
    data: Partial<CreateEjerciciosGratitudInput>
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

    if (data.cosas_buenas !== undefined) {
      entry.cosas_buenas = data.cosas_buenas;
    }
    if (data.personas_agradecidas !== undefined) {
      entry.personas_agradecidas = data.personas_agradecidas;
    }
    if (data.aprendizaje_crecimiento !== undefined) {
      entry.aprendizaje_crecimiento = data.aprendizaje_crecimiento;
    }
    if (data.aspectos_valorados !== undefined) {
      entry.aspectos_valorados = data.aspectos_valorados;
    }

    return await this.repo.save(entry);
  }

  static async getCountByPaciente(paciente_id: string): Promise<number> {
    return this.repo.count({ where: { paciente_id } });
  }
}
