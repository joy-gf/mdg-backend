import { Router } from "express";
import { UsuariosController } from "../controllers/usuarios.controller";

const router = Router();

router.get("/", UsuariosController.getAll);
router.get("/:id", UsuariosController.getById);
router.post("/", UsuariosController.create);
router.put("/:id", UsuariosController.update);
router.delete("/:id", UsuariosController.delete);

export default router;
