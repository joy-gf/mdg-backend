import { Router } from "express";
import { HistorialSesionController } from "../controllers/historialSesion.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/tratamientos/:tratamientoId/sesiones",
  authMiddleware,
  HistorialSesionController.listByTratamiento
);

router.post(
  "/tratamientos/:tratamientoId/sesiones",
  authMiddleware,
  HistorialSesionController.create
);

router.put(
  "/tratamientos/:tratamientoId/sesiones/:sesionId",
  authMiddleware,
  HistorialSesionController.update
);

router.put(
  "/tratamientos/:tratamientoId/sesiones/:sesionId/finalizar",
  authMiddleware,
  HistorialSesionController.finalizar
);

export default router;
