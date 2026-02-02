import { Request, Response } from "express";
import { PsicologoResumenService } from "../services/psicologoResumen.service";

export class PsicologoResumenController {
  /**
   * Obtener resumen de pacientes de un psicólogo
   * GET /api/psicologos/:id/resumen-pacientes
   */
  static async getResumenPacientes(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const psicologoId = req.params.id;

      if (!psicologoId) {
        return res.status(400).json({
          message: "Se requiere el ID del psicólogo",
        });
      }

      const resumen =
        await PsicologoResumenService.getResumenPacientes(psicologoId);

      return res.json(resumen);
    } catch (error) {
      console.error("Error en getResumenPacientes:", error);
      return res.status(500).json({
        message: "Error al obtener resumen de pacientes",
        error: (error as Error).message,
      });
    }
  }
}
