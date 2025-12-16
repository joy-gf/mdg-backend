import { Router } from "express";
import { RolesController } from "../controllers/roles.controller";

const router = Router();

router.get("/", RolesController.getAll);
router.post("/", RolesController.create);
router.put("/:id", RolesController.update);
router.delete("/:id", RolesController.delete);

export default router;
