import { Router } from "express";
import { HistorialSesionController } from "../controllers/historialSesion.controller";

const router = Router();

router.get(
  "/tratamientos/:tratamientoId/sesiones",
  HistorialSesionController.listByTratamiento
);

router.post(
  "/tratamientos/:tratamientoId/sesiones",
  HistorialSesionController.create
);

router.put(
  "/tratamientos/:tratamientoId/sesiones/:sesionId",
  HistorialSesionController.update
);

router.put(
  "/tratamientos/:tratamientoId/sesiones/:sesionId/finalizar",
  HistorialSesionController.finalizar
);

export default router;
