import { Router } from "express";
import { NotasRapidasController } from "../controllers/notasRapidas.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/paciente/:pacienteId", authMiddleware, NotasRapidasController.getByPaciente);
router.post("/", authMiddleware, NotasRapidasController.create);
router.put("/:id", authMiddleware, NotasRapidasController.update);
router.delete("/:id", authMiddleware, NotasRapidasController.delete);

export default router;
