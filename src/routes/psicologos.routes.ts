import { Router } from "express";
import { PsicologosController } from "../controllers/psicologos.controller";

const router = Router();

router.get("/", PsicologosController.getAll);
router.post("/with-user", PsicologosController.createWithUser);
router.get("/usuario/:usuarioId", PsicologosController.getByUsuario);
router.get("/:id", PsicologosController.getById);
router.post("/", PsicologosController.create);
router.put("/:id", PsicologosController.update);

export default router;
