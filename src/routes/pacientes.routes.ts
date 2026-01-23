import { Router } from "express";
import { PacientesController } from "../controllers/pacientes.controller";

const router = Router();

router.get("/", PacientesController.getAll);
router.post("/with-user", PacientesController.createWithUser);
router.get("/usuario/:usuarioId", PacientesController.getByUsuario);
router.get("/:id", PacientesController.getById);
router.post("/", PacientesController.create);
router.post("/:id/add-user", PacientesController.addUserToPaciente);
router.put("/:id", PacientesController.update);
router.put("/:id/dar-de-baja", PacientesController.darDeBaja);
router.put("/:id/reactivar", PacientesController.reactivar);

export default router;
