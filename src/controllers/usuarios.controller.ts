import { Request, Response } from "express";
import { UsuarioService } from "../services/usuarios.service";
export class UsuariosController {
  static async getAll(req: Request, res: Response) {
    const data = await UsuarioService.getUsuarios();
    res.json(data);
  }

  static async getById(req: Request, res: Response) {
    const id = req.params.id;
    const data = await UsuarioService.getUsuarioById(id);
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const data = await UsuarioService.createUsuario(req.body);
    res.status(201).json(data);
  }

  static async update(req: Request, res: Response) {
    const id = req.params.id;
    const data = await UsuarioService.updateUsuario(id, req.body);
    res.json(data);
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id;
    await UsuarioService.deleteUsuario(id);
    res.json({ success: true });
  }
}
