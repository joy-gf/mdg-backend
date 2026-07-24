import { Router } from "express";
import { EjerciciosGratitudController } from "../controllers/ejerciciosGratitud.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, EjerciciosGratitudController.create);

router.get("/paciente/:pacienteId", authMiddleware, EjerciciosGratitudController.getByPaciente);

router.get("/paciente/:pacienteId/count", authMiddleware, EjerciciosGratitudController.getCount);

router.get("/:id", authMiddleware, EjerciciosGratitudController.getById);

router.put("/:id", authMiddleware, EjerciciosGratitudController.update);

export default router;
