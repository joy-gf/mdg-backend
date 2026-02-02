import { Request, Response } from "express";
import { EstadisticasService } from "../services/estadisticas.service";

export class EstadisticasController {
  private static estadisticasService = new EstadisticasService();

  static async getEstadisticasPsicologos(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const periodo = parseInt(req.query.periodo as string) || 30;

      if (isNaN(periodo) || periodo <= 0) {
        return res.status(400).json({
          message: "El período debe ser un número positivo válido",
        });
      }

      const estadisticas =
        await EstadisticasController.estadisticasService.getEstadisticasPsicologos(
          periodo
        );

      return res.json(estadisticas);
    } catch (error) {
      console.error("Error en getEstadisticasPsicologos:", error);
      return res.status(500).json({
        message: "Error al obtener estadísticas de psicólogos",
      });
    }
  }
}
