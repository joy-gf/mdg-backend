import { Router } from "express";
import { DiarioEmocionalController } from "../controllers/diarioEmocional.controller";

const router = Router();

/**
 * Diary entry routes
 *
 * Security:
 * - Add authentication middleware here if not applied globally
 * - All routes should validate user permissions
 *
 * Available endpoints:
 * - POST   /              Create new entry
 * - GET    /paciente/:id  Get all entries for patient
 * - GET    /paciente/:id/count  Get entry count
 * - GET    /:id           Get single entry by ID
 * - PUT    /:id           Update entry (only same-day updates allowed)
 *
 * NOT available (by design):
 * - DELETE Delete entry (clinical data must be preserved)
 */

// Create new diary entry
router.post("/", DiarioEmocionalController.create);

// Get all entries for a patient (with optional date filters)
router.get("/paciente/:pacienteId", DiarioEmocionalController.getByPaciente);

// Get entry count for a patient
router.get("/paciente/:pacienteId/count", DiarioEmocionalController.getCount);

// Get single entry by ID (requires paciente_id query param for security)
router.get("/:id", DiarioEmocionalController.getById);

// Update entry (only same-day updates allowed for clinical data integrity)
router.put("/:id", DiarioEmocionalController.update);

export default router;
