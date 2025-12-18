import { Router } from "express";
import { AntecedentesPacienteController } from "../controllers/antecedentesPaciente.controller";

const router = Router();

router.get("/", AntecedentesPacienteController.getAll);
router.get("/:id", AntecedentesPacienteController.getById);
router.get("/paciente/:pacienteId", AntecedentesPacienteController.getByPacienteId);
router.post("/", AntecedentesPacienteController.create);
router.put("/:id", AntecedentesPacienteController.update);
router.delete("/:id", AntecedentesPacienteController.delete);

export default router;
