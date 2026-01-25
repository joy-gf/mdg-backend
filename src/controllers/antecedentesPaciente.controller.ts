import { Request, Response } from "express";
import { AntecedentesPacienteService } from "../services/antecedentesPaciente.service";

export class AntecedentesPacienteController {
  static async getAll(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.getAll();
    const response = data.map(item => ({ ...item, pacienteId: item.paciente_id }));
    res.json(response);
  }

  static async getById(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Antecedente no encontrado" });
    const response = { ...data, pacienteId: data.paciente_id };
    res.json(response);
  }

  static async getByPacienteId(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.getByPacienteId(req.params.pacienteId);
    if (!data) return res.status(404).json({ error: "Antecedente no encontrado" });
    const response = { ...data, pacienteId: data.paciente_id };
    res.json(response);
  }

  static async create(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.create(req.body);
    const response = data ? { ...data, pacienteId: data.paciente_id } : data;
    res.status(201).json(response);
  }

  static async update(req: Request, res: Response) {
    const data = await AntecedentesPacienteService.update(req.params.id, req.body);
    const response = data ? { ...data, pacienteId: data.paciente_id } : data;
    res.json(response);
  }

  static async delete(req: Request, res: Response) {
    await AntecedentesPacienteService.delete(req.params.id);
    res.json({ success: true });
  }
}
