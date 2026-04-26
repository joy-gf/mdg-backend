import { Request, Response } from "express";
import { PushSubscriptionService } from "../services/pushSubscription.service";

export class PushSubscriptionController {
  static async save(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    try {
      await PushSubscriptionService.save(userId, req.body);
      res.status(201).json({ ok: true });
    } catch (error) {
      console.error("[PushSubscription] Error al guardar:", error);
      res.status(500).json({ error: "Error al guardar suscripción push" });
    }
  }

  static async remove(req: Request, res: Response): Promise<void> {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        res.status(400).json({ error: "endpoint requerido" });
        return;
      }
      await PushSubscriptionService.remove(endpoint);
      res.json({ ok: true });
    } catch (error) {
      console.error("[PushSubscription] Error al eliminar:", error);
      res.status(500).json({ error: "Error al eliminar suscripción push" });
    }
  }

  static async sendReminders(req: Request, res: Response): Promise<void> {
    const secret = req.headers["x-cron-secret"];
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    try {
      const result = await PushSubscriptionService.sendReminders();
      res.json(result);
    } catch (error) {
      console.error("[PushSubscription] Error al enviar recordatorios:", error);
      res.status(500).json({ error: "Error al enviar recordatorios" });
    }
  }
}
