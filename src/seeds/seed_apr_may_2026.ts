/**
 * MDG Backend — Seed adicional: Citas y sesiones 2026-04-21 → 2026-05-05
 * Run: npx ts-node -r tsconfig-paths/register src/seeds/seed_apr_may_2026.ts
 *
 * Prerrequisito: seed.ts ya ejecutado
 * Constraint respetada: máx 3 citas Presencial por (fecha, hora) — 3 consultorios disponibles
 * Cada psicólogo tiene máx 1 cita por franja horaria
 */

import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "crypto";
import { AppDataSource } from "../config/datasource";
import { encryptText, deriveKey } from "../utils/crypto.util";

const ENC_KEY = deriveKey(
  process.env.ENCRYPTION_SECRET ?? "default-dev-secret-change-in-production"
);
function enc(plain: string): string {
  return JSON.stringify(encryptText(plain, ENC_KEY));
}

// ── IDs del seed principal ─────────────────────────────────
const PS_CMEND  = "dddd0004-dd00-dd00-dd00-000000000001";
const PS_AFLOR  = "dddd0004-dd00-dd00-dd00-000000000002";
const PS_RVARG  = "dddd0004-dd00-dd00-dd00-000000000003";
const PS_MQUISP = "dddd0004-dd00-dd00-dd00-000000000004";
const PS_JTORR  = "dddd0004-dd00-dd00-dd00-000000000005";

const PA = (n: number) => `eeee0005-ee00-ee00-ee00-${String(n).padStart(12, "0")}`;
const TR = (n: number) => `ffff0006-ff00-ff00-ff00-${String(n).padStart(12, "0")}`;

const C1 = "bbbb0002-bb00-bb00-bb00-000000000001";
const C2 = "bbbb0002-bb00-bb00-bb00-000000000002";
const C3 = "bbbb0002-bb00-bb00-bb00-000000000003";

// ── Tipos ──────────────────────────────────────────────────
type Modalidad = "Presencial" | "Virtual" | "Domicilio";
type EstadoCita = "finalizada" | "activa";

interface CitaDef {
  fecha: string;
  hora: string;
  psId: string;
  paNum: number;
  modalidad: Modalidad;
  consId: string | null;
  estado: EstadoCita;
  link?: string;
}

// ── Programa de citas ──────────────────────────────────────
//
// Verificación de presenciales por (fecha, hora):
//
//   Semana 1 (21-25 Apr, finalizada):
//     Apr21 09:00 → 2 (C1,C2) | Apr21 10:00 → 1 (C1)
//     Apr22 09:00 → 2 (C1,C2) | Apr22 10:00 → 1 (C3)
//     Apr23 09:00 → 2 (C1,C2) | Apr23 10:00 → 1 (C3)
//     Apr24 09:00 → 2 (C1,C2) | Apr24 10:00 → 0
//     Apr25 09:00 → 0 (Domicilio)
//
//   Semana 2 (28 Apr – 02 May, activa):
//     Apr28 14:00 → 2 (C1,C2) | Apr28 15:00 → 1 (C3)
//     Apr29 14:00 → 2 (C1,C2) | Apr29 15:00 → 1 (C3)
//     Apr30 14:00 → 1 (C1)    | Apr30 15:00 → 1 (C2)
//     May01 10:00 → 0          | May01 11:00 → 1 (C1)
//     May02 09:00 → 1 (C1)
//
//   Semana 3 (05 May, activa):
//     May05 09:00 → 2 (C1,C2) | May05 10:00 → 1 (C3)
//     May05 14:00 → 2 (C1,C2) | May05 15:00 → 1 (C3)

const citas: CitaDef[] = [

  // ══ SEMANA 1: 21-25 Abr 2026 (finalizada) ══════════════

  // Lunes 21 Abr
  { fecha:"2026-04-21", hora:"09:00:00", psId:PS_CMEND,  paNum:1,  modalidad:"Presencial", consId:C1,   estado:"finalizada" },
  { fecha:"2026-04-21", hora:"09:00:00", psId:PS_RVARG,  paNum:8,  modalidad:"Presencial", consId:C2,   estado:"finalizada" },
  { fecha:"2026-04-21", hora:"09:00:00", psId:PS_AFLOR,  paNum:5,  modalidad:"Virtual",    consId:null, estado:"finalizada", link:"https://meet.google.com/mdg-001" },
  { fecha:"2026-04-21", hora:"10:00:00", psId:PS_CMEND,  paNum:2,  modalidad:"Virtual",    consId:null, estado:"finalizada", link:"https://meet.google.com/mdg-002" },
  { fecha:"2026-04-21", hora:"10:00:00", psId:PS_MQUISP, paNum:12, modalidad:"Presencial", consId:C1,   estado:"finalizada" },

  // Martes 22 Abr
  { fecha:"2026-04-22", hora:"09:00:00", psId:PS_CMEND,  paNum:3,  modalidad:"Presencial", consId:C2,   estado:"finalizada" },
  { fecha:"2026-04-22", hora:"09:00:00", psId:PS_RVARG,  paNum:9,  modalidad:"Presencial", consId:C1,   estado:"finalizada" },
  { fecha:"2026-04-22", hora:"10:00:00", psId:PS_CMEND,  paNum:4,  modalidad:"Virtual",    consId:null, estado:"finalizada", link:"https://meet.google.com/mdg-003" },
  { fecha:"2026-04-22", hora:"10:00:00", psId:PS_JTORR,  paNum:14, modalidad:"Presencial", consId:C3,   estado:"finalizada" },

  // Miércoles 23 Abr
  { fecha:"2026-04-23", hora:"09:00:00", psId:PS_AFLOR,  paNum:6,  modalidad:"Presencial", consId:C1,   estado:"finalizada" },
  { fecha:"2026-04-23", hora:"09:00:00", psId:PS_MQUISP, paNum:13, modalidad:"Presencial", consId:C2,   estado:"finalizada" },
  { fecha:"2026-04-23", hora:"10:00:00", psId:PS_AFLOR,  paNum:7,  modalidad:"Presencial", consId:C3,   estado:"finalizada" },

  // Jueves 24 Abr
  { fecha:"2026-04-24", hora:"09:00:00", psId:PS_RVARG,  paNum:10, modalidad:"Presencial", consId:C1,   estado:"finalizada" },
  { fecha:"2026-04-24", hora:"09:00:00", psId:PS_JTORR,  paNum:15, modalidad:"Presencial", consId:C2,   estado:"finalizada" },
  { fecha:"2026-04-24", hora:"10:00:00", psId:PS_RVARG,  paNum:11, modalidad:"Virtual",    consId:null, estado:"finalizada", link:"https://meet.google.com/mdg-004" },

  // Viernes 25 Abr
  { fecha:"2026-04-25", hora:"09:00:00", psId:PS_JTORR,  paNum:16, modalidad:"Domicilio",  consId:null, estado:"finalizada" },

  // ══ SEMANA 2: 28 Abr – 02 May 2026 (activa) ═══════════

  // Lunes 28 Abr
  { fecha:"2026-04-28", hora:"14:00:00", psId:PS_CMEND,  paNum:1,  modalidad:"Presencial", consId:C1,   estado:"activa" },
  { fecha:"2026-04-28", hora:"14:00:00", psId:PS_RVARG,  paNum:8,  modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-005" },
  { fecha:"2026-04-28", hora:"14:00:00", psId:PS_AFLOR,  paNum:5,  modalidad:"Presencial", consId:C2,   estado:"activa" },
  { fecha:"2026-04-28", hora:"15:00:00", psId:PS_CMEND,  paNum:2,  modalidad:"Presencial", consId:C3,   estado:"activa" },
  { fecha:"2026-04-28", hora:"15:00:00", psId:PS_MQUISP, paNum:12, modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-006" },

  // Martes 29 Abr
  { fecha:"2026-04-29", hora:"14:00:00", psId:PS_CMEND,  paNum:3,  modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-007" },
  { fecha:"2026-04-29", hora:"14:00:00", psId:PS_RVARG,  paNum:9,  modalidad:"Presencial", consId:C1,   estado:"activa" },
  { fecha:"2026-04-29", hora:"14:00:00", psId:PS_JTORR,  paNum:14, modalidad:"Presencial", consId:C2,   estado:"activa" },
  { fecha:"2026-04-29", hora:"15:00:00", psId:PS_CMEND,  paNum:4,  modalidad:"Presencial", consId:C3,   estado:"activa" },

  // Miércoles 30 Abr
  { fecha:"2026-04-30", hora:"14:00:00", psId:PS_AFLOR,  paNum:6,  modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-008" },
  { fecha:"2026-04-30", hora:"14:00:00", psId:PS_MQUISP, paNum:13, modalidad:"Presencial", consId:C1,   estado:"activa" },
  { fecha:"2026-04-30", hora:"15:00:00", psId:PS_AFLOR,  paNum:7,  modalidad:"Presencial", consId:C2,   estado:"activa" },

  // Jueves 01 May (Día del Trabajo — virtuales para el feriado)
  { fecha:"2026-05-01", hora:"10:00:00", psId:PS_RVARG,  paNum:10, modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-009" },
  { fecha:"2026-05-01", hora:"10:00:00", psId:PS_JTORR,  paNum:15, modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-010" },
  { fecha:"2026-05-01", hora:"11:00:00", psId:PS_RVARG,  paNum:11, modalidad:"Presencial", consId:C1,   estado:"activa" },

  // Viernes 02 May
  { fecha:"2026-05-02", hora:"09:00:00", psId:PS_JTORR,  paNum:16, modalidad:"Presencial", consId:C1,   estado:"activa" },

  // ══ SEMANA 3: 05 May 2026 (activa — solo lunes) ════════

  { fecha:"2026-05-05", hora:"09:00:00", psId:PS_CMEND,  paNum:1,  modalidad:"Presencial", consId:C1,   estado:"activa" },
  { fecha:"2026-05-05", hora:"09:00:00", psId:PS_RVARG,  paNum:8,  modalidad:"Presencial", consId:C2,   estado:"activa" },
  { fecha:"2026-05-05", hora:"09:00:00", psId:PS_AFLOR,  paNum:5,  modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-011" },
  { fecha:"2026-05-05", hora:"10:00:00", psId:PS_CMEND,  paNum:2,  modalidad:"Presencial", consId:C3,   estado:"activa" },
  { fecha:"2026-05-05", hora:"10:00:00", psId:PS_MQUISP, paNum:12, modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-012" },
  { fecha:"2026-05-05", hora:"14:00:00", psId:PS_RVARG,  paNum:9,  modalidad:"Presencial", consId:C1,   estado:"activa" },
  { fecha:"2026-05-05", hora:"14:00:00", psId:PS_JTORR,  paNum:14, modalidad:"Presencial", consId:C2,   estado:"activa" },
  { fecha:"2026-05-05", hora:"15:00:00", psId:PS_CMEND,  paNum:3,  modalidad:"Virtual",    consId:null, estado:"activa", link:"https://meet.google.com/mdg-013" },
  { fecha:"2026-05-05", hora:"15:00:00", psId:PS_MQUISP, paNum:13, modalidad:"Presencial", consId:C3,   estado:"activa" },
];

// ── Sesiones semana 1 (Apr 21-25) ─────────────────────────
// paNum → fecha_sesion de la cita correspondiente
const week1SessionDates: Record<number, string> = {
  1:"2026-04-21", 2:"2026-04-21",
  3:"2026-04-22", 4:"2026-04-22",
  5:"2026-04-21", 6:"2026-04-23", 7:"2026-04-23",
  8:"2026-04-21", 9:"2026-04-22",
  10:"2026-04-24", 11:"2026-04-24",
  12:"2026-04-21", 13:"2026-04-23",
  14:"2026-04-22", 15:"2026-04-24", 16:"2026-04-25",
};

// ── foto_perfil para cada psicólogo ───────────────────────
const fotosPeril: [string, string][] = [
  [PS_CMEND,  "https://ui-avatars.com/api/?name=Carlos+Mendoza&background=1565C0&color=fff&size=150&bold=true"],
  [PS_AFLOR,  "https://ui-avatars.com/api/?name=Ana+Flores&background=AD1457&color=fff&size=150&bold=true"],
  [PS_RVARG,  "https://ui-avatars.com/api/?name=Roberto+Vargas&background=1B5E20&color=fff&size=150&bold=true"],
  [PS_MQUISP, "https://ui-avatars.com/api/?name=Maria+Quispe&background=6A1B9A&color=fff&size=150&bold=true"],
  [PS_JTORR,  "https://ui-avatars.com/api/?name=Javier+Torres&background=E65100&color=fff&size=150&bold=true"],
];

async function run() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // 1. Citas
    for (const c of citas) {
      await qr.query(`
        INSERT INTO citas
          (id, "pacienteId", "psicologoId", "consultorioId",
           fecha_sesion, hora_sesion, duracion_minutos, tipo_cita,
           estado, solicitada_por, link_cita, fecha_confirmacion)
        VALUES ($1,$2,$3,$4,$5,$6,60,$7,$8,'psicologo',$9,$10)
      `, [
        randomUUID(),
        PA(c.paNum), c.psId, c.consId,
        c.fecha, c.hora,
        c.modalidad,
        c.estado,
        c.link ?? null,
        c.estado === "finalizada" ? new Date(`${c.fecha}T18:00:00`) : null,
      ]);
    }

    // 2. Sesiones semana 1 (Apr 21-25, todas finalizadas)
    for (let i = 1; i <= 16; i++) {
      const fechaSesion = week1SessionDates[i];
      await qr.query(`
        INSERT INTO historial_sesion
          (id, "tratamientoId", fecha_sesion, fecha_proxima_sesion,
           seguimiento_encrypted, recomendaciones_encrypted,
           objetivos_proxima_sesion_encrypted, finalizada, fecha_finalizacion)
        VALUES ($1,$2,$3,null,$4,$5,$6,true,$7)
      `, [
        randomUUID(),
        TR(i),
        fechaSesion,
        enc(`Semana 21-25 Abr: El paciente reporta avances en el trabajo terapéutico. Se revisaron y practicaron las técnicas trabajadas en sesiones anteriores. Se observa buena adherencia al plan de tratamiento y disposición al cambio.`),
        enc(`Continuar con práctica diaria de técnicas aprendidas. Mantener registro de situaciones desafiantes en el diario personal. Preservar las rutinas de autocuidado establecidas.`),
        enc(`Revisar avances y registros de la semana. Profundizar en la técnica principal del plan. Explorar situación específica reportada por el paciente para próxima sesión.`),
        `${fechaSesion}T18:00:00`,
      ]);
    }

    // 3. foto_perfil de psicólogos
    for (const [psId, url] of fotosPeril) {
      await qr.query(`UPDATE psicologos SET foto_perfil = $1 WHERE id = $2`, [url, psId]);
    }

    await qr.commitTransaction();
    console.log("✅ Seed Apr-May 2026 completado:");
    console.log(`   ${citas.length} citas insertadas (Apr 21 – May 5)`);
    console.log("   16 sesiones (semana Apr 21-25) insertadas");
    console.log("   5 foto_perfil de psicólogos actualizadas");
  } catch (err) {
    await qr.rollbackTransaction();
    console.error("❌ Error — rollback aplicado:", err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

run();
