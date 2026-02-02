import { Router } from "express";
import { DiarioEmocionalController } from "../controllers/diarioEmocional.controller";
import { authMiddleware } from "../middleware/auth.middleware";

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
router.post("/", authMiddleware, DiarioEmocionalController.create);

// Get all entries for a patient (with optional date filters)
router.get("/paciente/:pacienteId", authMiddleware, DiarioEmocionalController.getByPaciente);

// Get entry count for a patient
router.get("/paciente/:pacienteId/count", authMiddleware, DiarioEmocionalController.getCount);

// Get single entry by ID (requires paciente_id query param for security)
router.get("/:id", authMiddleware, DiarioEmocionalController.getById);

router.put("/:id", authMiddleware, DiarioEmocionalController.update);

export default router;
