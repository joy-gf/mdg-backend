import { Request, Response } from "express";
import { RegistroTareasService } from "../services/registroTareas.service";
import { TipoTareaTerapeutica } from "../types/registroTareas.types";

/**
 * RegistroTareasController
 *
 * Controlador para el registro de tareas terapéuticas
 */
export class RegistroTareasController {
  /**
   * Registrar una tarea completada
   * POST /api/registro-tareas
   *
   * Body:
   * {
   *   paciente_id: string,
   *   tipo_tarea: TipoTareaTerapeutica,
   *   fecha: string (YYYY-MM-DD),
   *   actividades_realizadas?: string[], // solo para registro_actividades
   *   veces_completado?: number,
   *   tiempo_total_segundos?: number,
   *   metadata?: object
   * }
   */
  static async registrarTarea(req: Request, res: Response) {
    try {
      const data = req.body;

      const registro = await RegistroTareasService.registrarTarea(data);

      res.status(201).json(registro);
    } catch (error: any) {
      console.error("Error registrando tarea:", error);

      if (error.status === 400) {
        return res.status(400).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al registrar tarea",
        details: error.message,
      });
    }
  }

  /**
   * Obtener todos los registros de un paciente
   * GET /api/registro-tareas/paciente/:pacienteId
   *
   * Query params:
   * - desde: YYYY-MM-DD (optional)
   * - hasta: YYYY-MM-DD (optional)
   * - tipo_tarea: TipoTareaTerapeutica (optional)
   */
  static async getByPaciente(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const filters = {
        desde: req.query.desde as string | undefined,
        hasta: req.query.hasta as string | undefined,
        tipo_tarea: req.query.tipo_tarea as TipoTareaTerapeutica | undefined,
      };

      const registros = await RegistroTareasService.getByPaciente(
        pacienteId,
        filters
      );

      res.json(registros);
    } catch (error: any) {
      console.error("Error obteniendo registros:", error);
      res.status(500).json({
        error: "Error al obtener registros",
        details: error.message,
      });
    }
  }

  /**
   * Obtener registro de un día específico
   * GET /api/registro-tareas/paciente/:pacienteId/fecha/:fecha
   *
   * Query params:
   * - tipo_tarea: TipoTareaTerapeutica (required)
   */
  static async getByPacienteAndFecha(req: Request, res: Response) {
    try {
      const { pacienteId, fecha } = req.params;
      const tipo_tarea = req.query.tipo_tarea as TipoTareaTerapeutica;

      if (!tipo_tarea) {
        return res.status(400).json({
          error: "TIPO_TAREA_REQUERIDO",
          message: "Se requiere especificar el tipo de tarea",
        });
      }

      const registro = await RegistroTareasService.getByPacienteAndFecha(
        pacienteId,
        tipo_tarea,
        fecha // Pass as string to avoid UTC conversion
      );

      if (!registro) {
        return res.status(404).json({
          error: "REGISTRO_NO_ENCONTRADO",
          message: "No se encontró registro para esta fecha",
        });
      }

      res.json(registro);
    } catch (error: any) {
      console.error("Error obteniendo registro por fecha:", error);
      res.status(500).json({
        error: "Error al obtener registro",
        details: error.message,
      });
    }
  }

  /**
   * Obtener resumen de cumplimiento
   * GET /api/registro-tareas/paciente/:pacienteId/resumen
   *
   * Query params:
   * - desde: YYYY-MM-DD (required)
   * - hasta: YYYY-MM-DD (required)
   */
  static async getResumenCumplimiento(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const { desde, hasta } = req.query;

      if (!desde || !hasta) {
        return res.status(400).json({
          error: "FECHAS_REQUERIDAS",
          message: "Se requieren las fechas desde y hasta",
        });
      }

      const resumen = await RegistroTareasService.getResumenCumplimiento(
        pacienteId,
        desde as string,
        hasta as string
      );

      res.json(resumen);
    } catch (error: any) {
      console.error("Error obteniendo resumen:", error);
      res.status(500).json({
        error: "Error al obtener resumen",
        details: error.message,
      });
    }
  }

  /**
   * Eliminar un registro
   * DELETE /api/registro-tareas/:id
   *
   * Query params:
   * - paciente_id: string (required for security)
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const paciente_id = req.query.paciente_id as string;

      if (!paciente_id) {
        return res.status(400).json({
          error: "PACIENTE_ID_REQUERIDO",
          message: "Se requiere el ID del paciente para validación",
        });
      }

      await RegistroTareasService.delete(id, paciente_id);

      res.status(204).send();
    } catch (error: any) {
      console.error("Error eliminando registro:", error);

      if (error.status === 404) {
        return res.status(404).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al eliminar registro",
        details: error.message,
      });
    }
  }
}
