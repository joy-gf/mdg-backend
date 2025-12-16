import { Router } from "express";
import { PsicologosController } from "../controllers/psicologos.controller";

const router = Router();

router.get("/", PsicologosController.getAll);
router.get("/:id", PsicologosController.getById);
router.get("/usuario/:usuarioId", PsicologosController.getByUsuario);
router.post("/", PsicologosController.create);
router.put("/:id", PsicologosController.update);

export default router;
