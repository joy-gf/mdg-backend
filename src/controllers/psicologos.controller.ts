import { Request, Response } from "express";
import { PsicologosService } from "../services/psicologos.service";

export class PsicologosController {
  static async getAll(req: Request, res: Response) {
    const search = req.query.search as string;
    const data = await PsicologosService.getAll(search);
    res.json(data);
  }

  static async getById(req: Request, res: Response) {
    const data = await PsicologosService.getById(req.params.id);
    if (!data)
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    res.json(data);
  }

  static async getByUsuario(req: Request, res: Response) {
    const data = await PsicologosService.getByUsuario(req.params.usuarioId);
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const data = await PsicologosService.create(req.body);
    res.status(201).json(data);
  }

  static async update(req: Request, res: Response) {
    await PsicologosService.update(req.params.id, req.body);
    res.json({ success: true });
  }
}
