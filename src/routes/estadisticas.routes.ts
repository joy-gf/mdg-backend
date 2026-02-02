import { Router } from "express";
import { EstadisticasController } from "../controllers/estadisticas.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/psicologos",
  authMiddleware,
  EstadisticasController.getEstadisticasPsicologos
);

export default router;
