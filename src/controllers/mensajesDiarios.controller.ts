import { Request, Response } from "express";
import { MensajesDiariosService } from "../services/mensajesDiarios.service";

export class MensajesDiariosController {
  private static mensajesService = new MensajesDiariosService();

  /**
   * Obtener mensaje del día para un paciente
   * GET /api/mensajes-diarios/paciente/:id
   */
  static async getMensajeDia(req: Request, res: Response): Promise<Response> {
    try {
      const { id: pacienteId } = req.params;

      if (!pacienteId) {
        return res.status(400).json({
          message: "ID de paciente requerido",
        });
      }

      const mensaje = await MensajesDiariosController.mensajesService.getMensajeDia(pacienteId);

      if (!mensaje) {
        return res.status(204).send(); // No content - sin mensaje hoy
      }

      return res.json(mensaje);
    } catch (error) {
      console.error("Error en getMensajeDia:", error);
      return res.status(500).json({
        message: "Error al obtener mensaje del día",
      });
    }
  }
}
