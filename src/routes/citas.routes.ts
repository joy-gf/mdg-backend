import { Router } from "express";
import { CitasController } from "../controllers/citas.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, CitasController.getAll);
router.get("/paciente/:pacienteId", authMiddleware, CitasController.getByPaciente);
router.get("/psicologo/:psicologoId", authMiddleware, CitasController.getByPsicologo);
router.post("/", authMiddleware, CitasController.create);
router.post("/solicitar", authMiddleware, CitasController.solicitar);
router.put("/:id", authMiddleware, CitasController.update);
router.put("/:id/cancelar", authMiddleware, CitasController.cancelar);
router.put("/:id/confirmar", authMiddleware, CitasController.confirmar);
router.put("/:id/rechazar", authMiddleware, CitasController.rechazar);
router.delete("/:id", authMiddleware, CitasController.delete);

export default router;
