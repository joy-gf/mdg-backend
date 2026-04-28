import webpush from "web-push";
import { AppDataSource } from "../config/datasource";
import { PushSubscription } from "../entities/PushSubscription.entity";
import { Cita } from "../entities/Cita.entity";

function initVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    console.warn("[Push] VAPID keys no configuradas. Las notificaciones push están desactivadas.");
    return false;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  return true;
}

const vapidReady = initVapid();

export class PushSubscriptionService {
  static async save(userId: string, subscriptionData: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }): Promise<void> {
    const repo = AppDataSource.getRepository(PushSubscription);
    await repo.upsert(
      {
        userId,
        endpoint: subscriptionData.endpoint,
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
      },
      ["endpoint"]
    );
  }

  static async remove(endpoint: string): Promise<void> {
    const repo = AppDataSource.getRepository(PushSubscription);
    await repo.delete({ endpoint });
  }

  static async sendReminders(): Promise<{ sent: number; errors: number }> {
    if (!vapidReady) return { sent: 0, errors: 0 };

    const citaRepo = AppDataSource.getRepository(Cita);
    const subRepo = AppDataSource.getRepository(PushSubscription);

    // Citas que comienzan en ~30 minutos (ventana de 29 a 31 min)
    const citas = await citaRepo
      .createQueryBuilder("cita")
      .leftJoinAndSelect("cita.psicologo", "psicologo")
      .leftJoinAndSelect("cita.paciente", "paciente")
      .where("cita.estado IN (:...estados)", { estados: ["activa", "pendiente"] })
      .andWhere(
        `(cita.fecha_sesion::text || ' ' || cita.hora_sesion)::timestamp
         BETWEEN (NOW() AT TIME ZONE 'America/La_Paz') + INTERVAL '29 minutes'
             AND (NOW() AT TIME ZONE 'America/La_Paz') + INTERVAL '31 minutes'`
      )
      .getMany();

    let sent = 0;
    let errors = 0;

    for (const cita of citas) {
      const userIds: string[] = [];
      if (cita.psicologo?.usuario_id) userIds.push(cita.psicologo.usuario_id);
      if (cita.paciente?.usuario_id) userIds.push(cita.paciente.usuario_id);
      if (userIds.length === 0) continue;

      const subscriptions = await subRepo
        .createQueryBuilder("sub")
        .where("sub.userId IN (:...userIds)", { userIds })
        .getMany();

      const horaFormateada = cita.hora_sesion.slice(0, 5);
      const payload = JSON.stringify({
        title: "Recordatorio de cita",
        body: `Tienes una cita en 30 minutos a las ${horaFormateada}`,
        url: "/agenda",
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          errors++;
          // 410 Gone = el usuario desinstalÃ³ la suscripciÃ³n, limpiar
          if (err.statusCode === 410) {
            await subRepo.delete({ endpoint: sub.endpoint });
          }
        }
      }
    }

    console.log(`[Push] Recordatorios enviados: ${sent}, errores: ${errors}`);
    return { sent, errors };
  }
}
