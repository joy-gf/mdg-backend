import { Request, Response } from "express";
import { HistorialTratamientoService } from "../services/historialTratamiento.service";

export class HistorialTratamientoController {

  static async listByPaciente(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const data = await HistorialTratamientoService.getByPaciente(pacienteId);
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching tratamientos:", error);
      res.status(500).json({
        error: "Error al obtener tratamientos",
        details: error.message,
      });
    }
  }

  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await HistorialTratamientoService.getById(id);

      if (!data) {
        return res.status(404).json({
          error: "TRATAMIENTO_NO_ENCONTRADO",
          message: "No se encontró el tratamiento especificado",
        });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Error fetching tratamiento:", error);
      res.status(500).json({
        error: "Error al obtener tratamiento",
        details: error.message,
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const { psicologoId, ...body } = req.body;

      const tratamiento = await HistorialTratamientoService.create(
        pacienteId,
        psicologoId,
        body
      );

      res.status(201).json(tratamiento);
    } catch (error: any) {
      console.error("Error creating tratamiento:", error);

      if (error.message === "Paciente no encontrado" || error.message === "Psicólogo no encontrado") {
        return res.status(404).json({
          error: "ENTIDAD_NO_ENCONTRADA",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al crear tratamiento",
        details: error.message,
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await HistorialTratamientoService.update(id, req.body);

      res.json(data);
    } catch (error: any) {
      console.error("Error updating tratamiento:", error);

      if (error.message === "Tratamiento no encontrado") {
        return res.status(404).json({
          error: "TRATAMIENTO_NO_ENCONTRADO",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al actualizar tratamiento",
        details: error.message,
      });
    }
  }

  static async cerrar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { comentarios_finales_encrypted } = req.body;

      const data = await HistorialTratamientoService.cerrar(
        id,
        comentarios_finales_encrypted
      );

      if (!data) {
        return res.status(404).json({
          error: "TRATAMIENTO_NO_ENCONTRADO",
          message: "No se encontró el tratamiento especificado",
        });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Error closing tratamiento:", error);
      res.status(500).json({
        error: "Error al cerrar tratamiento",
        details: error.message,
      });
    }
  }
}
