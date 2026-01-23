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

  static async getByUsuario(req: Request, res: Response) {
    const data = await PacientesService.getByUsuario(req.params.usuarioId);
    if (!data) return res.status(404).json({ error: "Paciente no encontrado para este usuario" });
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    try {
      const data = await PacientesService.create(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating paciente:", error);

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

      // Generic error
      res.status(500).json({
        error: "Error al crear paciente",
        details: error.message,
      });
    }
  }

  static async createWithUser(req: Request, res: Response) {
    try {
      const data = await PacientesService.createWithUser(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating paciente with user:", error);

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

      // Generic error
      res.status(500).json({
        error: "Error al crear paciente con usuario",
        details: error.message,
      });
    }
  }

  static async update(req: Request, res: Response) {
    await PacientesService.update(req.params.id, req.body);
    res.json({ success: true });
  }

  static async addUserToPaciente(req: Request, res: Response) {
    try {
      const data = await PacientesService.addUserToPaciente(req.params.id, req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error adding user to paciente:", error);

      // Handle paciente not found
      if (error.status === 404 && error.code === "PACIENTE_NO_ENCONTRADO") {
        return res.status(404).json({
          error: error.code,
          message: error.message,
        });
      }

      // Handle paciente already has user
      if (error.status === 409 && error.code === "PACIENTE_YA_TIENE_USUARIO") {
        return res.status(409).json({
          error: error.code,
          message: error.message,
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

      // Generic error
      res.status(500).json({
        error: "Error al agregar usuario al paciente",
        details: error.message,
      });
    }
  }

  static async darDeBaja(req: Request, res: Response) {
    try {
      const data = await PacientesService.darDeBaja(req.params.id);
      res.json(data);
    } catch (error: any) {
      console.error("Error dando de baja paciente:", error);

      if (error.status === 404 && error.code === "PACIENTE_NO_ENCONTRADO") {
        return res.status(404).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al dar de baja el paciente",
        details: error.message,
      });
    }
  }

  static async reactivar(req: Request, res: Response) {
    try {
      const data = await PacientesService.reactivar(req.params.id);
      res.json(data);
    } catch (error: any) {
      console.error("Error reactivando paciente:", error);

      if (error.status === 404 && error.code === "PACIENTE_NO_ENCONTRADO") {
        return res.status(404).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al reactivar el paciente",
        details: error.message,
      });
    }
  }
}