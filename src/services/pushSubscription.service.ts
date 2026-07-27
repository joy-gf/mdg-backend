import webpush from "web-push";
import * as cron from "node-cron";
import { AppDataSource } from "../config/datasource";
import { PushSubscription } from "../entities/PushSubscription.entity";
import { Cita } from "../entities/Cita.entity";
import { Psicologo } from "../entities/Psicologo.entity";
import { Paciente } from "../entities/Paciente.entity";

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

  static async notifyNuevaSolicitud(
    psicologoId: string,
    pacienteId: string,
    fecha: string,
    hora: string
  ): Promise<void> {
    if (!vapidReady) return;

    const psicologoRepo = AppDataSource.getRepository(Psicologo);
    const pacienteRepo = AppDataSource.getRepository(Paciente);
    const subRepo = AppDataSource.getRepository(PushSubscription);

    const [psicologo, paciente] = await Promise.all([
      psicologoRepo.findOne({ where: { id: psicologoId } }),
      pacienteRepo.findOne({ where: { id: pacienteId } }),
    ]);

    if (!psicologo?.usuario_id) return;

    const subscriptions = await subRepo.find({ where: { userId: psicologo.usuario_id } });
    if (subscriptions.length === 0) return;

    const nombrePaciente = paciente ? `${paciente.nombres} ${paciente.apellidos}` : "Un paciente";
    const horaFormateada = hora.slice(0, 5);

    const payload = JSON.stringify({
      title: "Nueva solicitud de cita",
      body: `${nombrePaciente} ha solicitado una cita para el ${fecha} a las ${horaFormateada}`,
      url: `/agenda?date=${fecha}&time=${horaFormateada}`,
      data: {
        tipo: "nueva_solicitud",
        fecha,
        hora: horaFormateada,
        pacienteId,
        psicologoId,
      },
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410) {
          await subRepo.delete({ endpoint: sub.endpoint });
        }
      }
    }
  }

  static async notifyConfirmacionCita(
    pacienteId: string,
    fecha: string,
    hora: string
  ): Promise<void> {
    if (!vapidReady) return;

    const pacienteRepo = AppDataSource.getRepository(Paciente);
    const subRepo = AppDataSource.getRepository(PushSubscription);

    const paciente = await pacienteRepo.findOne({ where: { id: pacienteId } });
    if (!paciente?.usuario_id) return;

    const subscriptions = await subRepo.find({ where: { userId: paciente.usuario_id } });
    if (subscriptions.length === 0) return;

    const horaFormateada = hora.slice(0, 5);
    const payload = JSON.stringify({
      title: "Cita confirmada",
      body: `Tu cita del ${fecha} a las ${horaFormateada} ha sido confirmada. ¡Te esperamos!`,
      url: "/agenda",
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410) {
          await subRepo.delete({ endpoint: sub.endpoint });
        }
      }
    }
  }

  static async notifyRechazo(
    pacienteId: string,
    fecha: string,
    hora: string,
    motivo?: string | null
  ): Promise<void> {
    if (!vapidReady) return;

    const pacienteRepo = AppDataSource.getRepository(Paciente);
    const subRepo = AppDataSource.getRepository(PushSubscription);

    const paciente = await pacienteRepo.findOne({ where: { id: pacienteId } });
    if (!paciente?.usuario_id) return;

    const subscriptions = await subRepo.find({ where: { userId: paciente.usuario_id } });
    if (subscriptions.length === 0) return;

    const horaFormateada = hora.slice(0, 5);
    const body = motivo
      ? `Tu solicitud de cita para el ${fecha} a las ${horaFormateada} fue rechazada. Motivo: ${motivo}`
      : `Tu solicitud de cita para el ${fecha} a las ${horaFormateada} fue rechazada.`;

    const payload = JSON.stringify({
      title: "Solicitud de cita rechazada",
      body,
      url: "/agenda",
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410) {
          await subRepo.delete({ endpoint: sub.endpoint });
        }
      }
    }
  }

  static async sendReminders(): Promise<{ sent: number; errors: number }> {
    return PushSubscriptionService.sendRemindersByWindow(
      30, 6,
      (hora) => `Tienes una cita en 30 minutos a las ${hora}`
    );
  }

  static async sendRemindersByWindow(
    minutesBefore: number,
    windowMinutes: number,
    messageBuilder: (hora: string) => string,
    target: "all" | "paciente" | "psicologo" = "all"
  ): Promise<{ sent: number; errors: number }> {
    if (!vapidReady) return { sent: 0, errors: 0 };

    const citaRepo = AppDataSource.getRepository(Cita);
    const subRepo = AppDataSource.getRepository(PushSubscription);
    const half = windowMinutes / 2;
    const minLow = minutesBefore - half;
    const minHigh = minutesBefore + half;

    const citas = await citaRepo
      .createQueryBuilder("cita")
      .leftJoinAndSelect("cita.psicologo", "psicologo")
      .leftJoinAndSelect("cita.paciente", "paciente")
      .where("cita.estado IN (:...estados)", { estados: ["activa", "pendiente"] })
      .andWhere(
        `(cita.fecha_sesion::text || ' ' || cita.hora_sesion)::timestamp
         BETWEEN (NOW() AT TIME ZONE 'America/La_Paz') + INTERVAL '${minLow} minutes'
             AND (NOW() AT TIME ZONE 'America/La_Paz') + INTERVAL '${minHigh} minutes'`
      )
      .getMany();

    let sent = 0;
    let errors = 0;

    for (const cita of citas) {
      const userIds: string[] = [];
      if (target !== "paciente" && cita.psicologo?.usuario_id) userIds.push(cita.psicologo.usuario_id);
      if (target !== "psicologo" && cita.paciente?.usuario_id) userIds.push(cita.paciente.usuario_id);
      if (userIds.length === 0) continue;

      const subscriptions = await subRepo
        .createQueryBuilder("sub")
        .where("sub.userId IN (:...userIds)", { userIds })
        .getMany();

      const horaFormateada = cita.hora_sesion.slice(0, 5);
      const payload = JSON.stringify({
        title: "Recordatorio de cita",
        body: messageBuilder(horaFormateada),
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
          if (err.statusCode === 410) {
            await subRepo.delete({ endpoint: sub.endpoint });
          }
        }
      }
    }

    return { sent, errors };
  }
}

export function scheduleReminders(): void {
  // Corre cada 2 minutos; ventana de ±3 min alrededor de cada marca de tiempo
  cron.schedule("*/2 * * * *", async () => {
    try {
      const [r30m, r1h, r24h] = await Promise.all([
        PushSubscriptionService.sendRemindersByWindow(
          30, 6,
          (hora) => `Tienes una cita en 30 minutos a las ${hora}`,
          "paciente"
        ),
        PushSubscriptionService.sendRemindersByWindow(
          60, 6,
          (hora) => `Tu cita es en 1 hora, a las ${hora}. ¡Prepárate!`,
          "all"
        ),
        PushSubscriptionService.sendRemindersByWindow(
          1440, 6,
          (hora) => `Tienes una cita mañana a las ${hora}. ¡No olvides asistir!`,
          "paciente"
        ),
      ]);

      const totalSent = r30m.sent + r1h.sent + r24h.sent;
      if (totalSent > 0) {
        console.log(`[Push] Recordatorios — 30min: ${r30m.sent}, 1h: ${r1h.sent}, 24h: ${r24h.sent}`);
      }
    } catch (err) {
      console.error("[Push] Error en recordatorios automáticos:", err);
    }
  });

  console.log("[Push] Recordatorios automáticos programados (cada 2 min)");
}
