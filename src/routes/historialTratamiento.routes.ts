import { Router } from "express";
import { HistorialTratamientoController } from "../controllers/historialTratamiento.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/pacientes/:pacienteId/tratamientos",
  authMiddleware,
  HistorialTratamientoController.listByPaciente
);

router.post(
  "/pacientes/:pacienteId/tratamientos",
  authMiddleware,
  HistorialTratamientoController.create
);

router.get(
  "/tratamientos/:id",
  authMiddleware,
  HistorialTratamientoController.getOne
);

router.put(
  "/tratamientos/:id",
  authMiddleware,
  HistorialTratamientoController.update
);

router.put(
  "/tratamientos/:id/cerrar",
  authMiddleware,
  HistorialTratamientoController.cerrar
);

export default router;
