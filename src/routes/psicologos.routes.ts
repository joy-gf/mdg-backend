import { Router } from "express";
import { PsicologosController } from "../controllers/psicologos.controller";
import { PsicologoResumenController } from "../controllers/psicologoResumen.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, PsicologosController.getAll);
router.post("/with-user", authMiddleware, PsicologosController.createWithUser);
router.get("/usuario/:usuarioId", authMiddleware, PsicologosController.getByUsuario);
router.get("/:id/resumen-pacientes", authMiddleware, PsicologoResumenController.getResumenPacientes);
router.get("/:id", authMiddleware, PsicologosController.getById);
router.post("/", authMiddleware, PsicologosController.create);
router.post("/:id/add-user", authMiddleware, PsicologosController.addUserToPsicologo);
router.put("/:id", authMiddleware, PsicologosController.update);
router.put("/:id/dar-de-baja", authMiddleware, PsicologosController.darDeBaja);
router.put("/:id/reactivar", authMiddleware, PsicologosController.reactivar);

export default router;
