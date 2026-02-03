import { Router } from "express";
import { MensajesDiariosController } from "../controllers/mensajesDiarios.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/paciente/:id",
  authMiddleware,
  MensajesDiariosController.getMensajeDia
);

export default router;
