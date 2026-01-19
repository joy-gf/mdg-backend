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
    try {
      const data = await PsicologosService.create(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating psicologo:", error);

      // Handle CI duplicate error
      if (error.status === 409 && error.code === "CI_DUPLICADO") {
        return res.status(409).json({
          error: error.code,
          message: error.message,
          ci: error.ci,
        });
      }

      // Handle missing CI error
      if (error.status === 400 && error.code === "CI_REQUERIDO") {
        return res.status(400).json({
          error: error.code,
          message: error.message,
        });
      }

      // Handle missing matricula error
      if (error.status === 400 && error.code === "MATRICULA_REQUERIDA") {
        return res.status(400).json({
          error: error.code,
          message: error.message,
        });
      }

      // Generic error
      res.status(500).json({
        error: "Error al crear psicólogo",
        details: error.message,
      });
    }
  }

  static async createWithUser(req: Request, res: Response) {
    try {
      const data = await PsicologosService.createWithUser(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating psicologo with user:", error);

      // Handle CI duplicate error
      if (error.status === 409 && error.code === "CI_DUPLICADO") {
        return res.status(409).json({
          error: error.code,
          message: error.message,
          ci: error.ci,
        });
      }

      // Handle username duplicate error
      if (error.status === 409 && error.code === "USERNAME_DUPLICADO") {
        return res.status(409).json({
          error: error.code,
          message: error.message,
          userName: error.userName,
        });
      }

      // Handle missing CI error
      if (error.status === 400 && error.code === "CI_REQUERIDO") {
        return res.status(400).json({
          error: error.code,
          message: error.message,
        });
      }

      // Handle missing matricula error
      if (error.status === 400 && error.code === "MATRICULA_REQUERIDA") {
        return res.status(400).json({
          error: error.code,
          message: error.message,
        });
      }

      // Generic error
      res.status(500).json({
        error: "Error al crear psicólogo con usuario",
        details: error.message,
      });
    }
  }

  static async update(req: Request, res: Response) {
    await PsicologosService.update(req.params.id, req.body);
    res.json({ success: true });
  }
}
