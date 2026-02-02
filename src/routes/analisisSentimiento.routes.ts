import { Router } from "express";
import { AnalisisSentimientoController } from "../controllers/analisisSentimiento.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/:pacienteId", authMiddleware, AnalisisSentimientoController.getAnalisisAgregado);
router.get("/:pacienteId/entradas", authMiddleware, AnalisisSentimientoController.getAnalisisEntradas);
router.post("/:pacienteId/procesar-pendientes", authMiddleware, AnalisisSentimientoController.procesarPendientes);
router.post("/entrada/:diarioId/analizar", authMiddleware, AnalisisSentimientoController.analizarEntrada);
router.get("/diario/:diarioId", authMiddleware, AnalisisSentimientoController.getAnalisisByDiarioId);
router.put("/:analisisId/nota-validacion", authMiddleware, AnalisisSentimientoController.updateNotaValidacion);

export default router;
