import { Router } from "express";
import { AnalisisSentimientoController } from "../controllers/analisisSentimiento.controller";

const router = Router();

router.get("/:pacienteId", AnalisisSentimientoController.getAnalisisAgregado);
router.get("/:pacienteId/entradas", AnalisisSentimientoController.getAnalisisEntradas);
router.post("/:pacienteId/procesar-pendientes", AnalisisSentimientoController.procesarPendientes);
router.post("/entrada/:diarioId/analizar", AnalisisSentimientoController.analizarEntrada);
router.get("/diario/:diarioId", AnalisisSentimientoController.getAnalisisByDiarioId);
router.put("/:analisisId/nota-validacion", AnalisisSentimientoController.updateNotaValidacion);

export default router;
