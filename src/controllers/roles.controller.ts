import { Request, Response } from "express";
import { RolService } from "../services/roles.service";

export class RolesController {
  static async getAll(req: Request, res: Response) {
    const data = await RolService.getRoles();
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const data = await RolService.createRol(req.body);
    res.status(201).json(data);
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = await RolService.updateRol(id, req.body);
    res.json(data);
  }

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await RolService.deleteRol(id);
    res.json({ success: true });
  }
}
