import { Router } from "express";
import { RolesController } from "../controllers/roles.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, RolesController.getAll);
router.post("/", authMiddleware, RolesController.create);
router.put("/:id", authMiddleware, RolesController.update);
router.delete("/:id", authMiddleware, RolesController.delete);

export default router;
