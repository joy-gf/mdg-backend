import { Router } from "express";
import { BackupController } from "../controllers/backup.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Requieren autenticación
router.post("/", authMiddleware, BackupController.create);
router.get("/", authMiddleware, BackupController.list);
router.get("/download/:filename", authMiddleware, BackupController.download);

export default router;
