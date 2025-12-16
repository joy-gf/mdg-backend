import { Router } from "express";
import { ConsultoriosController } from "../controllers/consultorios.controller";

const router = Router();

router.get("/", ConsultoriosController.getAll);
router.post("/", ConsultoriosController.create);
router.put("/:id", ConsultoriosController.update);
router.delete("/:id", ConsultoriosController.delete);

export default router;
