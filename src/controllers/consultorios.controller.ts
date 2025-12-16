import { Request, Response } from "express";
import { ConsultoriosService } from "../services/consultorios.service";

export class ConsultoriosController {
  static async getAll(req: Request, res: Response) {
    const data = await ConsultoriosService.getAll();
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const data = await ConsultoriosService.create(req.body);
    res.status(201).json(data);
  }

  static async update(req: Request, res: Response) {
    const id = req.params.id;
    const data = await ConsultoriosService.update(id, req.body);
    res.json(data);
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id;
    const result = await ConsultoriosService.delete(id);
    res.json(result);
  }
}
