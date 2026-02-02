import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/datasource";
import { RegistroTareasTerapeuticas } from "../entities/RegistroTareasTerapeuticas.entity";
import {
  RegistroTareaInput,
  RegistroTareaOutput,
  TipoTareaTerapeutica,
} from "../types/registroTareas.types";

interface GetRegistrosFilters {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  tipo_tarea?: TipoTareaTerapeutica;
}

export class RegistroTareasService {
  private static repo = AppDataSource.getRepository(RegistroTareasTerapeuticas);

  /**
   * Crear o actualizar un registro de tarea del día
   * Si ya existe un registro para ese día y tipo de tarea, lo actualiza (incrementa contador)
   */
  static async registrarTarea(data: RegistroTareaInput): Promise<RegistroTareaOutput> {
    if (!data.paciente_id) {
      throw {
        status: 400,
        code: "PACIENTE_ID_REQUERIDO",
        message: "El ID del paciente es requerido",
      };
    }

    if (!data.tipo_tarea) {
      throw {
        status: 400,
        code: "TIPO_TAREA_REQUERIDO",
        message: "El tipo de tarea es requerido",
      };
    }

    // Buscar si ya existe un registro para este día
    const fechaStr = data.fecha.toISOString().split("T")[0];
    const existingRegistro = await this.repo.findOne({
      where: {
        paciente_id: data.paciente_id,
        tipo_tarea: data.tipo_tarea,
        fecha: new Date(fechaStr) as any,
      },
    });

    if (existingRegistro) {
      // Actualizar registro existente
      if (data.tipo_tarea === "registro_actividades") {
        // Para registro de actividades, reemplazar la lista completa
        existingRegistro.actividades_realizadas = data.actividades_realizadas || [];
      } else {
        // Para otras tareas, incrementar contador y tiempo
        existingRegistro.veces_completado += data.veces_completado || 1;
        existingRegistro.tiempo_total_segundos += data.tiempo_total_segundos || 0;
      }

      if (data.metadata) {
        existingRegistro.metadata = {
          ...existingRegistro.metadata,
          ...data.metadata,
        };
      }

      return await this.repo.save(existingRegistro);
    } else {
      // Crear nuevo registro
      const nuevoRegistro = this.repo.create({
        paciente_id: data.paciente_id,
        tipo_tarea: data.tipo_tarea,
        fecha: new Date(fechaStr),
        actividades_realizadas: data.actividades_realizadas || null,
        veces_completado: data.veces_completado || (data.tipo_tarea === "registro_actividades" ? 0 : 1),
        tiempo_total_segundos: data.tiempo_total_segundos || 0,
        metadata: data.metadata || null,
      });

      return await this.repo.save(nuevoRegistro);
    }
  }

  /**
   * Obtener todos los registros de un paciente con filtros opcionales
   */
  static async getByPaciente(
    paciente_id: string,
    filters?: GetRegistrosFilters
  ): Promise<RegistroTareaOutput[]> {
    const where: any = { paciente_id };

    if (filters?.tipo_tarea) {
      where.tipo_tarea = filters.tipo_tarea;
    }

    if (filters?.desde && filters?.hasta) {
      where.fecha = Between(filters.desde, filters.hasta);
    } else if (filters?.desde) {
      where.fecha = MoreThanOrEqual(filters.desde);
    } else if (filters?.hasta) {
      where.fecha = LessThanOrEqual(filters.hasta);
    }

    return this.repo.find({
      where,
      order: { fecha: "DESC", created_at: "DESC" },
    });
  }

  /**
   * Obtener registro de un día específico
   */
  static async getByPacienteAndFecha(
    paciente_id: string,
    tipo_tarea: TipoTareaTerapeutica,
    fecha: Date
  ): Promise<RegistroTareaOutput | null> {
    const fechaStr = fecha.toISOString().split("T")[0];

    return this.repo.findOne({
      where: {
        paciente_id,
        tipo_tarea,
        fecha: new Date(fechaStr) as any,
      },
    });
  }

  /**
   * Obtener resumen de cumplimiento por tipo de tarea
   */
  static async getResumenCumplimiento(
    paciente_id: string,
    desde: string,
    hasta: string
  ) {
    const registros = await this.getByPaciente(paciente_id, { desde, hasta });

    const resumen: Record<
      TipoTareaTerapeutica,
      {
        total_dias: number;
        total_veces: number;
        tiempo_total: number;
      }
    > = {
      registro_actividades: { total_dias: 0, total_veces: 0, tiempo_total: 0 },
      ejercicios_gratitud: { total_dias: 0, total_veces: 0, tiempo_total: 0 },
      higiene_sueno: { total_dias: 0, total_veces: 0, tiempo_total: 0 },
      ejercicios_respiracion: { total_dias: 0, total_veces: 0, tiempo_total: 0 },
    };

    for (const registro of registros) {
      if (resumen[registro.tipo_tarea]) {
        resumen[registro.tipo_tarea].total_dias += 1;
        resumen[registro.tipo_tarea].total_veces += registro.veces_completado;
        resumen[registro.tipo_tarea].tiempo_total += registro.tiempo_total_segundos;
      }
    }

    return resumen;
  }

  /**
   * Eliminar un registro específico
   */
  static async delete(id: string, paciente_id: string): Promise<void> {
    const registro = await this.repo.findOne({
      where: { id, paciente_id },
    });

    if (!registro) {
      throw {
        status: 404,
        code: "REGISTRO_NO_ENCONTRADO",
        message: "Registro no encontrado o no pertenece al paciente",
      };
    }

    await this.repo.remove(registro);
  }
}
