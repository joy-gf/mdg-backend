import { Router } from "express";
import { RegistroTareasController } from "../controllers/registroTareas.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * Registro de tareas terapéuticas routes
 *
 * Available endpoints:
 * - POST   /                           Registrar tarea completada
 * - GET    /paciente/:pacienteId      Obtener registros del paciente
 * - GET    /paciente/:pacienteId/fecha/:fecha  Obtener registro de un día específico
 * - GET    /paciente/:pacienteId/resumen      Obtener resumen de cumplimiento
 * - DELETE /:id                        Eliminar registro
 */

// Registrar tarea completada
router.post("/", authMiddleware, RegistroTareasController.registrarTarea);

// Obtener todos los registros de un paciente (con filtros opcionales)
router.get(
  "/paciente/:pacienteId",
  authMiddleware,
  RegistroTareasController.getByPaciente
);

// Obtener resumen de cumplimiento
router.get(
  "/paciente/:pacienteId/resumen",
  authMiddleware,
  RegistroTareasController.getResumenCumplimiento
);

// Obtener registro de un día específico
router.get(
  "/paciente/:pacienteId/fecha/:fecha",
  authMiddleware,
  RegistroTareasController.getByPacienteAndFecha
);

// Eliminar registro
router.delete("/:id", authMiddleware, RegistroTareasController.delete);

export default router;
