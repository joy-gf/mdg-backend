import { Request, Response } from "express";
import { DiarioEmocionalService } from "../services/diarioEmocional.service";

/**
 * DiarioEmocionalController
 *
 * Security Notes:
 * - Authentication middleware should validate JWT token before reaching controller
 * - Only patients can create/read their own diary entries
 * - NO update or delete endpoints (clinical data integrity requirement)
 * - All text is stored encrypted in database
 */
export class DiarioEmocionalController {
  /**
   * Create a new diary entry
   * POST /api/diario-emocional
   *
   * Body:
   * {
   *   paciente_id: string,
   *   fecha_entrada: string (YYYY-MM-DD),
   *   emocion_seleccionada: string,
   *   texto_entrada_encrypted: string (JSON: {iv, ciphertext})
   * }
   */
  static async create(req: Request, res: Response) {
    try {
      const data = await DiarioEmocionalService.create(req.body);

      // TODO: Call ML service for sentiment analysis
      // const plaintext = DiarioEmocionalService.decryptForAnalysis(data.texto_entrada_encrypted);
      // const analisis = await SentimentAnalysisService.analyze(plaintext, data.id);

      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating diary entry:", error);

      if (error.status === 400) {
        return res.status(400).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al crear entrada de diario",
        details: error.message,
      });
    }
  }

  /**
   * Get all entries for a patient
   * GET /api/diario-emocional/paciente/:pacienteId
   *
   * Query params:
   * - desde: YYYY-MM-DD (optional)
   * - hasta: YYYY-MM-DD (optional)
   *
   * Security: Validate that authenticated user is the patient or their psychologist
   */
  static async getByPaciente(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const filters = {
        desde: req.query.desde as string | undefined,
        hasta: req.query.hasta as string | undefined,
      };

      const entries = await DiarioEmocionalService.getByPaciente(pacienteId, filters);

      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching diary entries:", error);
      res.status(500).json({
        error: "Error al obtener entradas de diario",
        details: error.message,
      });
    }
  }

  /**
   * Get a single entry by ID
   * GET /api/diario-emocional/:id
   *
   * Query params:
   * - paciente_id: string (required for security validation)
   *
   * Security: Validates entry belongs to specified patient
   */
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

      const entry = await DiarioEmocionalService.getById(id, paciente_id);

      res.json(entry);
    } catch (error: any) {
      console.error("Error fetching diary entry:", error);

      if (error.status === 404) {
        return res.status(404).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al obtener entrada de diario",
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

      const entry = await DiarioEmocionalService.update(id, paciente_id, updateData);

      res.json(entry);
    } catch (error: any) {
      console.error("Error updating diary entry:", error);

      if (error.status === 404) {
        return res.status(404).json({
          error: error.code,
          message: error.message,
        });
      }

      if (error.status === 403) {
        return res.status(403).json({
          error: error.code,
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Error al actualizar entrada de diario",
        details: error.message,
      });
    }
  }

  /**
   * Get entry count for a patient
   * GET /api/diario-emocional/paciente/:pacienteId/count
   */
  static async getCount(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const count = await DiarioEmocionalService.getCountByPaciente(pacienteId);

      res.json({ count });
    } catch (error: any) {
      console.error("Error getting entry count:", error);
      res.status(500).json({
        error: "Error al contar entradas",
        details: error.message,
      });
    }
  }
}
