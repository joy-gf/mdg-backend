import { Router } from "express";
import { PushSubscriptionController } from "../controllers/pushSubscription.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Rutas protegidas con JWT (llamadas desde el frontend)
router.post("/", authMiddleware, PushSubscriptionController.save);
router.post("/remove", authMiddleware, PushSubscriptionController.remove);

// Ruta para cron externo (protegida con x-cron-secret)
router.post("/send-reminders", PushSubscriptionController.sendReminders);

export default router;
