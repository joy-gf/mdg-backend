import { Router } from "express";
import { PacientesController } from "../controllers/pacientes.controller";

const router = Router();

router.get("/", PacientesController.getAll);
router.post("/with-user", PacientesController.createWithUser);
router.get("/usuario/:usuarioId", PacientesController.getByUsuario);
router.get("/:id", PacientesController.getById);
router.post("/", PacientesController.create);
router.put("/:id", PacientesController.update);

export default router;
