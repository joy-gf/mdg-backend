import { Router } from "express";
import { CitasController } from "../controllers/citas.controller";

const router = Router();

router.get("/", CitasController.getAll);
router.get("/paciente/:pacienteId", CitasController.getByPaciente);
router.get("/psicologo/:psicologoId", CitasController.getByPsicologo);
router.post("/", CitasController.create);
router.put("/:id", CitasController.update);
router.put("/:id/cancelar", CitasController.cancelar);

export default router;
