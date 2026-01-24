import { Request, Response } from "express";
import { HistorialSesionService } from "../services/historialSesion.service";

export class HistorialSesionController {
  static async listByTratamiento(req: Request, res: Response) {
    try {
      const { tratamientoId } = req.params;
      const data = await HistorialSesionService.getByTratamiento(tratamientoId);
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching sesiones:", error);
      res.status(500).json({
        error: "Error al obtener sesiones",
        details: error.message,
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { tratamientoId } = req.params;
      const sesion = await HistorialSesionService.create(
        tratamientoId,
        req.body
      );
      res.status(201).json(sesion);
    } catch (error: any) {
      console.error("Error creating sesion:", error);

      if (error.message === "Tratamiento no encontrado") {
        return res.status(404).json({
          error: "TRATAMIENTO_NO_ENCONTRADO",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al crear sesión",
        details: error.message,
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { tratamientoId, sesionId } = req.params;
      const sesion = await HistorialSesionService.update(
        sesionId,
        tratamientoId,
        req.body
      );
      res.json(sesion);
    } catch (error: any) {
      console.error("Error updating sesion:", error);

      if (error.message === "Sesión no encontrada") {
        return res.status(404).json({
          error: "SESION_NO_ENCONTRADA",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al actualizar sesión",
        details: error.message,
      });
    }
  }
}
