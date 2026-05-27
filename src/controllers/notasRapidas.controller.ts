import { Request, Response } from "express";
import { NotasRapidasService } from "../services/notasRapidas.service";

export class NotasRapidasController {
  static async getByPaciente(req: Request, res: Response) {
    try {
      const notas = await NotasRapidasService.getByPaciente(req.params.pacienteId);
      res.json(notas);
    } catch (err: any) {
      res.status(500).json({ error: "Error al obtener notas", details: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { pacienteId, psicologoId, contenido } = req.body;
      const nota = await NotasRapidasService.create({ pacienteId, psicologoId, contenido });
      res.status(201).json(nota);
    } catch (err: any) {
      if (err.status === 400) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: "Error al crear nota", details: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const nota = await NotasRapidasService.update(req.params.id, req.body.contenido);
      res.json(nota);
    } catch (err: any) {
      if (err.status === 400) return res.status(400).json({ error: err.message });
      if (err.status === 404) return res.status(404).json({ error: err.message });
      res.status(500).json({ error: "Error al actualizar nota", details: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await NotasRapidasService.delete(req.params.id);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: "Error al eliminar nota", details: err.message });
    }
  }
}
