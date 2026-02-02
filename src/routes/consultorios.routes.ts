import { Router } from "express";
import { ConsultoriosController } from "../controllers/consultorios.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, ConsultoriosController.getAll);
router.post("/", authMiddleware, ConsultoriosController.create);
router.put("/:id", authMiddleware, ConsultoriosController.update);
router.delete("/:id", authMiddleware, ConsultoriosController.delete);

export default router;
