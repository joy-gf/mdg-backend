import { Router } from "express";
import { PsicologosController } from "../controllers/psicologos.controller";
import { PsicologoResumenController } from "../controllers/psicologoResumen.controller";

const router = Router();

router.get("/", PsicologosController.getAll);
router.post("/with-user", PsicologosController.createWithUser);
router.get("/usuario/:usuarioId", PsicologosController.getByUsuario);
router.get("/:id/resumen-pacientes", PsicologoResumenController.getResumenPacientes);
router.get("/:id", PsicologosController.getById);
router.post("/", PsicologosController.create);
router.post("/:id/add-user", PsicologosController.addUserToPsicologo);
router.put("/:id", PsicologosController.update);
router.put("/:id/dar-de-baja", PsicologosController.darDeBaja);
router.put("/:id/reactivar", PsicologosController.reactivar);

export default router;
