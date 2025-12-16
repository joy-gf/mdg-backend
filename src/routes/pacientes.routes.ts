import { Router } from "express";
import { PacientesController } from "../controllers/pacientes.controller";

const router = Router();

router.get("/", PacientesController.getAll);
router.get("/:id", PacientesController.getById);
router.post("/", PacientesController.create);
router.put("/:id", PacientesController.update);

export default router;
