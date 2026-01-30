import { Request, Response } from "express";
import { AnalisisSentimientoService } from "../services/analisisSentimiento.service";
import { DiarioEmocionalService } from "../services/diarioEmocional.service";

export class AnalisisSentimientoController {
  /**
   * GET /api/analisis/:pacienteId
   * Obtiene análisis agregado para un paciente
   */
  static async getAnalisisAgregado(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const periodoDias = parseInt(req.query.periodo as string) || 30;

      const analisis = await AnalisisSentimientoService.getAnalisisAgregado(
        pacienteId,
        periodoDias
      );

      res.json(analisis);
    } catch (error: any) {
      console.error("Error obteniendo análisis agregado:", error);
      res.status(500).json({
        error: "Error al obtener análisis",
        message: error.message,
      });
    }
  }

  /**
   * GET /api/analisis/:pacienteId/entradas
   * Obtiene análisis individuales de cada entrada
   */
  static async getAnalisisEntradas(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const periodoDias = parseInt(req.query.periodo as string) || 30;

      const analisis = await AnalisisSentimientoService.getAnalisisByPaciente(
        pacienteId,
        periodoDias
      );

      res.json(analisis);
    } catch (error: any) {
      console.error("Error obteniendo análisis de entradas:", error);
      res.status(500).json({
        error: "Error al obtener análisis",
        message: error.message,
      });
    }
  }

  /**
   * POST /api/analisis/:pacienteId/procesar-pendientes
   * Procesa manualmente entradas pendientes de análisis
   */
  static async procesarPendientes(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;

      const result = await DiarioEmocionalService.processPendingAnalysis(pacienteId);

      res.json({
        success: true,
        message: `${result.processed} entradas procesadas exitosamente`,
        processed: result.processed,
      });
    } catch (error: any) {
      console.error("Error procesando pendientes:", error);
      res.status(error.status || 500).json({
        error: error.code || "ERROR_PROCESANDO",
        message: error.message || "Error al procesar análisis pendientes",
      });
    }
  }

  /**
   * POST /api/analisis/:diarioId/analizar
   * Fuerza el análisis de una entrada específica
   */
  static async analizarEntrada(req: Request, res: Response) {
    try {
      const { diarioId } = req.params;

      const analisis = await AnalisisSentimientoService.analizarEntrada(diarioId);

      if (!analisis) {
        return res.status(404).json({
          error: "No se pudo analizar la entrada",
          message: "Entrada no encontrada o error en el servicio de análisis",
        });
      }

      res.json({
        success: true,
        message: "Análisis completado",
        analisis,
      });
    } catch (error: any) {
      console.error("Error analizando entrada:", error);
      res.status(500).json({
        error: "Error al analizar entrada",
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/analisis/:analisisId/nota-validacion
   * Actualiza la nota de validación del psicólogo
   */
  static async updateNotaValidacion(req: Request, res: Response) {
    try {
      const { analisisId } = req.params;
      const { nota } = req.body;

      const analisis = await AnalisisSentimientoService.updateNotaValidacion(
        analisisId,
        nota
      );

      res.json({
        success: true,
        message: "Nota de validación actualizada",
        analisis,
      });
    } catch (error: any) {
      console.error("Error actualizando nota de validación:", error);
      res.status(500).json({
        error: "Error al actualizar nota",
        message: error.message,
      });
    }
  }

  /**
   * GET /api/analisis/diario/:diarioId
   * Obtiene el análisis de una entrada específica de diario
   */
  static async getAnalisisByDiarioId(req: Request, res: Response) {
    try {
      const { diarioId } = req.params;

      const analisis = await AnalisisSentimientoService.getAnalisisByDiarioId(diarioId);

      if (!analisis) {
        return res.status(404).json({
          error: "Análisis no encontrado",
          message: "No existe análisis para esta entrada de diario",
        });
      }

      res.json(analisis);
    } catch (error: any) {
      console.error("Error obteniendo análisis por diario ID:", error);
      res.status(500).json({
        error: "Error al obtener análisis",
        message: error.message,
      });
    }
  }
}
