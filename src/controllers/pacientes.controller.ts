import { Request, Response } from "express";
import { PacientesService } from "../services/paciente.service";

export class PacientesController {
  static async getAll(req: Request, res: Response) {
    const search = req.query.search as string;
    const data = await PacientesService.getAll(search);
    res.json(data);
  }

  static async getById(req: Request, res: Response) {
    const data = await PacientesService.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Paciente no encontrado" });
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const data = await PacientesService.create(req.body);
    res.status(201).json(data);
  }

  static async update(req: Request, res: Response) {
    await PacientesService.update(req.params.id, req.body);
    res.json({ success: true });
  }
}