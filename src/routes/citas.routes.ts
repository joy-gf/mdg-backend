import { Router } from "express";
import { CitasController } from "../controllers/citas.controller";

const router = Router();

router.get("/", CitasController.getAll);
router.get("/paciente/:pacienteId", CitasController.getByPaciente);
router.get("/psicologo/:psicologoId", CitasController.getByPsicologo);
router.post("/", CitasController.create);
router.put("/:id/cancelar", CitasController.cancelar);
router.put("/:id/reprogramar", CitasController.reprogramar);

export default router;
