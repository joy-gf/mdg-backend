import { Router } from "express";
import { CitasController } from "../controllers/citas.controller";

const router = Router();

router.get("/", CitasController.getAll);
router.get("/paciente/:pacienteId", CitasController.getByPaciente);
router.get("/psicologo/:psicologoId", CitasController.getByPsicologo);
router.post("/", CitasController.create);
router.post("/solicitar", CitasController.solicitar);
router.put("/:id", CitasController.update);
router.put("/:id/cancelar", CitasController.cancelar);
router.put("/:id/confirmar", CitasController.confirmar);
router.put("/:id/rechazar", CitasController.rechazar);

export default router;
