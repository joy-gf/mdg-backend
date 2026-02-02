import { Router } from "express";
import { PacientesController } from "../controllers/pacientes.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, PacientesController.getAll);
router.post("/with-user", authMiddleware, PacientesController.createWithUser);
router.get("/usuario/:usuarioId", authMiddleware, PacientesController.getByUsuario);
router.get("/:id", authMiddleware, PacientesController.getById);
router.post("/", authMiddleware, PacientesController.create);
router.post("/:id/add-user", authMiddleware, PacientesController.addUserToPaciente);
router.put("/:id", authMiddleware, PacientesController.update);
router.put("/:id/dar-de-baja", authMiddleware, PacientesController.darDeBaja);
router.put("/:id/reactivar", authMiddleware, PacientesController.reactivar);

export default router;
