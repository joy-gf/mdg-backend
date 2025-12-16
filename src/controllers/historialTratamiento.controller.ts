import { Request, Response } from "express";
import { HistorialTratamientoService } from "../services/historialTratamiento.service";

export class HistorialTratamientoController {

  static async listByPaciente(req: Request, res: Response) {
    const { pacienteId } = req.params;
    const data =
      await HistorialTratamientoService.getByPaciente(pacienteId);
    res.json(data);
  }

  static async getOne(req: Request, res: Response) {
    const { id } = req.params;
    const data = await HistorialTratamientoService.getById(id);
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const { pacienteId } = req.params;
    const { psicologoId, ...body } = req.body;

    const tratamiento =
      await HistorialTratamientoService.create(
        pacienteId,
        psicologoId,
        body
      );

    res.status(201).json(tratamiento);
  }

  static async cerrar(req: Request, res: Response) {
    const { id } = req.params;
    const { comentarios_finales } = req.body;

    const data =
      await HistorialTratamientoService.cerrar(
        id,
        comentarios_finales
      );

    res.json(data);
  }
}
