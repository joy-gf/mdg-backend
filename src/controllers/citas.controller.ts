import { Request, Response } from "express";
import { CitasService } from "../services/citas.service";

export class CitasController {
  static async getAll(req: Request, res: Response) {
    const data = await CitasService.getAll();
    res.json(data);
  }

  static async getByPaciente(req: Request, res: Response) {
    const { pacienteId } = req.params;
    const data = await CitasService.getByPaciente(pacienteId);
    res.json(data);
  }

  static async getByPsicologo(req: Request, res: Response) {
    const { psicologoId } = req.params;
    const data = await CitasService.getByPsicologo(psicologoId);
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const data = await CitasService.create(req.body);
    res.status(201).json(data);
  }

  static async update(req: Request, res: Response) {
    const data = await CitasService.update(req.params.id, req.body);
    res.json(data);
  }

  static async cancelar(req: Request, res: Response) {
    await CitasService.cancelar(req.params.id);
    res.json({ success: true });
  }
}
