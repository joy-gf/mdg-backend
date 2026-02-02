import { Router } from "express";
import { AntecedentesPacienteController } from "../controllers/antecedentesPaciente.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, AntecedentesPacienteController.getAll);
router.get("/:id", authMiddleware, AntecedentesPacienteController.getById);
router.get("/paciente/:pacienteId", authMiddleware, AntecedentesPacienteController.getByPacienteId);
router.post("/", authMiddleware, AntecedentesPacienteController.create);
router.put("/:id", authMiddleware, AntecedentesPacienteController.update);
router.delete("/:id", authMiddleware, AntecedentesPacienteController.delete);

export default router;
