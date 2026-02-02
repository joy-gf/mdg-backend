import { Router } from "express";
import { UsuariosController } from "../controllers/usuarios.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, UsuariosController.getAll);
router.get("/:id", authMiddleware, UsuariosController.getById);
router.post("/", authMiddleware, UsuariosController.create);
router.put("/:id", authMiddleware, UsuariosController.update);
router.delete("/:id", authMiddleware, UsuariosController.delete);

export default router;
