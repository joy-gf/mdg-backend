import { Request, Response } from "express";
import { HistorialSesionService } from "../services/historialSesion.service";

export class HistorialSesionController {
  static async listByTratamiento(req: Request, res: Response) {
    const { tratamientoId } = req.params;
    const data = await HistorialSesionService.getByTratamiento(tratamientoId);
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const { tratamientoId } = req.params;
    const sesion = await HistorialSesionService.create(
      tratamientoId,
      req.body
    );
    res.status(201).json(sesion);
  }
}
