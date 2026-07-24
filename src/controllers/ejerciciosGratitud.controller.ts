import { Request, Response } from "express";
import { EjerciciosGratitudService } from "../services/ejerciciosGratitud.service";

export class EjerciciosGratitudController {
  static async create(req: Request, res: Response) {
    try {
      const data = await EjerciciosGratitudService.create(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating gratitude exercise:", error);

      if (error.status === 400) {
        return res.status(400).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al crear ejercicio de gratitud",
        details: error.message,
      });
    }
  }

  static async getByPaciente(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const filters = {
        desde: req.query.desde as string | undefined,
        hasta: req.query.hasta as string | undefined,
      };

      const entries = await EjerciciosGratitudService.getByPaciente(pacienteId, filters);
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching gratitude exercises:", error);
      res.status(500).json({
        error: "Error al obtener ejercicios de gratitud",
        details: error.message,
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const paciente_id = req.query.paciente_id as string;

      if (!paciente_id) {
        return res.status(400).json({
          error: "PACIENTE_ID_REQUERIDO",
          message: "Se requiere el ID del paciente para validación de seguridad",
        });
      }

      const entry = await EjerciciosGratitudService.getById(id, paciente_id);
      res.json(entry);
    } catch (error: any) {
      console.error("Error fetching gratitude exercise:", error);

      if (error.status === 404) {
        return res.status(404).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al obtener ejercicio de gratitud",
        details: error.message,
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { paciente_id, ...updateData } = req.body;

      if (!paciente_id) {
        return res.status(400).json({
          error: "PACIENTE_ID_REQUERIDO",
          message: "Se requiere el ID del paciente para validación de seguridad",
        });
      }

      const entry = await EjerciciosGratitudService.update(id, paciente_id, updateData);
      res.json(entry);
    } catch (error: any) {
      console.error("Error updating gratitude exercise:", error);

      if (error.status === 404) {
        return res.status(404).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al actualizar ejercicio de gratitud",
        details: error.message,
      });
    }
  }

  static async getCount(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const count = await EjerciciosGratitudService.getCountByPaciente(pacienteId);
      res.json({ count });
    } catch (error: any) {
      console.error("Error getting exercise count:", error);
      res.status(500).json({
        error: "Error al contar ejercicios",
        details: error.message,
      });
    }
  }
}
