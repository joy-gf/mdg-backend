import { Request, Response } from "express";
import { CitasService } from "../services/citas.service";

export class CitasController {
  static async getAll(req: Request, res: Response) {
    const data = await CitasService.getAll();
    res.json(data);
  }

  static async getByPaciente(req: Request, res: Response) {
    const { pacienteId } = req.params;
    const data = await CitasService.getByPaciente(pacienteId);
    res.json(data);
  }

  static async getByPsicologo(req: Request, res: Response) {
    const { psicologoId } = req.params;
    const data = await CitasService.getByPsicologo(psicologoId);
    res.json(data);
  }

  static async create(req: Request, res: Response) {
    try {
      const data = await CitasService.create(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      if (error.message?.includes("consultorio") || error.message?.includes("psicólogo")) {
        return res.status(409).json({
          error: "CONFLICT",
          message: error.message,
          conflictType: error.conflictType || "unknown",
          conflictHora: error.conflictHora,
        });
      }

      if (error.message?.includes("pacienteId")) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Error al crear la cita",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const data = await CitasService.update(req.params.id, req.body);
      res.json(data);
    } catch (error: any) {
      if (error.message === "Cita no encontrada") {
        return res.status(404).json({
          error: "NOT_FOUND",
          message: error.message,
        });
      }

      if (error.message?.includes("consultorio") || error.message?.includes("psicólogo")) {
        return res.status(409).json({
          error: "CONFLICT",
          message: error.message,
          conflictType: error.conflictType || "unknown",
          conflictHora: error.conflictHora,
        });
      }

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Error al actualizar la cita",
      });
    }
  }

  static async cancelar(req: Request, res: Response) {
    await CitasService.cancelar(req.params.id);
    res.json({ success: true });
  }

  static async solicitar(req: Request, res: Response) {
    try {
      const data = await CitasService.solicitar(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      if (error.message?.includes("psicólogo")) {
        return res.status(409).json({
          error: "CONFLICT",
          message: error.message,
          conflictType: error.conflictType || "unknown",
          conflictHora: error.conflictHora,
        });
      }

      if (error.message?.includes("pacienteId")) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Error al solicitar la cita",
      });
    }
  }

  static async confirmar(req: Request, res: Response) {
    try {
      const data = await CitasService.confirmar(req.params.id, req.body);
      res.json(data);
    } catch (error: any) {
      if (error.message === "Cita no encontrada") {
        return res.status(404).json({
          error: "NOT_FOUND",
          message: error.message,
        });
      }

      if (
        error.message?.includes("estado pendiente") ||
        error.message?.includes("consultorio") ||
        error.message?.includes("link")
      ) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: error.message,
        });
      }

      if (error.message?.includes("ocupado") || error.message?.includes("agendada")) {
        return res.status(409).json({
          error: "CONFLICT",
          message: error.message,
          conflictType: error.conflictType || "unknown",
          conflictHora: error.conflictHora,
        });
      }

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Error al confirmar la cita",
      });
    }
  }

  static async rechazar(req: Request, res: Response) {
    try {
      const { motivo } = req.body;
      const data = await CitasService.rechazar(req.params.id, motivo);
      res.json(data);
    } catch (error: any) {
      if (error.message === "Cita no encontrada") {
        return res.status(404).json({
          error: "NOT_FOUND",
          message: error.message,
        });
      }

      if (error.message?.includes("estado pendiente")) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Error al rechazar la cita",
      });
    }
  }
}
