import { Request, Response } from "express";
import { AntecedentesPacienteService } from "../services/antecedentesPaciente.service";

export class AntecedentesPacienteController {
  static async getAll(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.getAll();
    res.json(data);
  }

  static async getById(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Antecedente no encontrado" });
    res.json(data);
  }

  static async getByPacienteId(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.getByPacienteId(req.params.pacienteId);
    if (!data) return res.status(404).json({ error: "Antecedente no encontrado" });
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.create(req.body);
    res.status(201).json(data);
  }

  static async update(req: Request, res: Response) {
    await AntecedentesPacienteService.update(req.params.id, req.body);
    res.json({ success: true });
  }

  static async delete(req: Request, res: Response) {
    await AntecedentesPacienteService.delete(req.params.id);
    res.json({ success: true });
  }
}
