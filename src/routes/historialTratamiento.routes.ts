import { Router } from "express";
import { HistorialTratamientoController } from "../controllers/historialTratamiento.controller";

const router = Router();

router.get(
  "/pacientes/:pacienteId/tratamientos",
  HistorialTratamientoController.listByPaciente
);

router.post(
  "/pacientes/:pacienteId/tratamientos",
  HistorialTratamientoController.create
);

router.get(
  "/tratamientos/:id",
  HistorialTratamientoController.getOne
);

router.put(
  "/tratamientos/:id/cerrar",
  HistorialTratamientoController.cerrar
);

export default router;
