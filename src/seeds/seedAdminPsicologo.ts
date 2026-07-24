/**
 * Seed: Admin como psicólogo
 *
 * Crea (si no existe) un registro en `psicologos` vinculado al usuario con
 * rol admin, y le asigna 4 pacientes (2 activos, 2 inactivos) para que el
 * admin también pueda operar como psicólogo (ver "Mis pacientes" en la lista
 * de pacientes, Mi Perfil, y recibir citas al correr seed:v3 después).
 *
 * A diferencia de seed.ts / seedOF.ts, este script NO trunca ninguna tabla —
 * es seguro correrlo sobre una base de datos con datos reales/existentes.
 * Es idempotente:
 *   - Si el admin ya tiene un registro en `psicologos`, lo reutiliza en vez
 *     de crear uno duplicado (usuario_id es NOT NULL UNIQUE en psicologos).
 *   - Si un paciente con el mismo CI ya existe, se omite (no se duplica).
 *
 * Ejecutar con: npm run seed:admin-psicologo
 */

import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "crypto";
import { AppDataSource } from "../config/datasource";

interface NewPatientDef {
  ci: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: string;
  escolaridad: string;
  ocupacion: string;
  estado_civil: string;
  telefono: string;
  direccion: string;
  contacto_emergencia: string;
  activo: boolean;
}

// 2 activos, 2 inactivos — CIs fuera del rango usado por seed.ts/seedV3.ts
// (5003xxx) para evitar cualquier colisión.
const PACIENTES: NewPatientDef[] = [
  { ci: "6009001", nombres: "Ricardo", apellidos: "Salinas Choque", fecha_nacimiento: "1990-04-11", sexo: "Masculino", escolaridad: "Universitaria", ocupacion: "Abogado", estado_civil: "Soltero", telefono: "+591 70090001", direccion: "Zona Central", contacto_emergencia: "Madre - 70090101", activo: true },
  { ci: "6009002", nombres: "Daniela", apellidos: "Fernández Rojas", fecha_nacimiento: "1995-09-23", sexo: "Femenino", escolaridad: "Universitaria", ocupacion: "Psicopedagoga", estado_civil: "Soltera", telefono: "+591 70090002", direccion: "Zona Norte", contacto_emergencia: "Hermano - 70090102", activo: true },
  { ci: "6009003", nombres: "Hugo", apellidos: "Mamani Cruz", fecha_nacimiento: "1982-12-02", sexo: "Masculino", escolaridad: "Secundaria", ocupacion: "Comerciante", estado_civil: "Casado", telefono: "+591 70090003", direccion: "Zona Sur", contacto_emergencia: "Esposa - 70090103", activo: false },
  { ci: "6009004", nombres: "Carla", apellidos: "Vega Aponte", fecha_nacimiento: "1998-06-30", sexo: "Femenino", escolaridad: "Universitaria", ocupacion: "Estudiante", estado_civil: "Soltera", telefono: "+591 70090004", direccion: "Zona Este", contacto_emergencia: "Padre - 70090104", activo: false },
];

async function main() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  try {
    await qr.startTransaction();

    // ── 1. Ubicar al usuario admin ───────────────────────
    const [adminUser] = await qr.query(
      `SELECT u.id, u.user_name FROM usuarios u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'admin'
       ORDER BY u.id ASC
       LIMIT 1`
    );
    if (!adminUser) throw new Error("No hay ningún usuario con rol 'admin' — abortando.");

    console.log(`  ℹ Usuario admin encontrado: ${adminUser.user_name} (${adminUser.id})`);

    // ── 2. Crear (o reutilizar) el psicólogo del admin ───
    let [psicologoAdmin] = await qr.query(
      `SELECT id, nombres FROM psicologos WHERE usuario_id = $1`,
      [adminUser.id]
    );

    if (psicologoAdmin) {
      console.log(`  ℹ El admin ya tiene perfil de psicólogo: ${psicologoAdmin.nombres} (${psicologoAdmin.id}) — se reutiliza.`);
    } else {
      const psicologoId = randomUUID();
      await qr.query(
        `INSERT INTO psicologos
           (id, usuario_id, nombres, apellidos, email, telefono, ciudad,
            ci, profesion, matricula_profesional, universidad, anios_experiencia,
            descripcion, especialidades, genero, activo)
         VALUES
           ($1,$2,'Admin','Sistema','admin@clinica.bo','+591 70000000','La Paz',
            '9999999','Psicólogo Clínico','PSI-ADM-00001','UMSA',5,
            'Perfil de psicólogo del administrador del sistema.',
            ARRAY['General'],'Otro',true)`,
        [psicologoId, adminUser.id]
      );
      psicologoAdmin = { id: psicologoId, nombres: "Admin" };
      console.log(`  ✓ Perfil de psicólogo creado para el admin (${psicologoId})`);
      console.log(`    Puedes editar nombre/CI/matrícula/etc. después desde la UI.`);
    }

    // ── 3. Pacientes del admin (2 activos, 2 inactivos) ──
    let creados = 0;
    let yaExistian = 0;

    for (const p of PACIENTES) {
      const [existente] = await qr.query(`SELECT id FROM pacientes WHERE ci = $1`, [p.ci]);
      if (existente) {
        yaExistian++;
        continue;
      }

      await qr.query(
        `INSERT INTO pacientes
           (id, psicologo_id, nombres, apellidos, ci, fecha_nacimiento, sexo,
            escolaridad, ocupacion, estado_civil, telefono, contacto_emergencia, direccion, activo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [randomUUID(), psicologoAdmin.id, p.nombres, p.apellidos, p.ci, p.fecha_nacimiento, p.sexo,
          p.escolaridad, p.ocupacion, p.estado_civil, p.telefono, p.contacto_emergencia, p.direccion, p.activo]
      );
      creados++;
    }

    await qr.commitTransaction();

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║   ✅  SEED ADMIN-PSICÓLOGO COMPLETADO                  ║");
    console.log("╠═══════════════════════════════════════════════════════╣");
    console.log(`║  Pacientes creados: ${creados} (2 activos, 2 inactivos)              ║`);
    console.log(`║  Pacientes ya existentes (omitidos): ${yaExistian}                       ║`);
    console.log("╠═══════════════════════════════════════════════════════╣");
    console.log("║  Nota: para que el admin reciba citas/tratamientos,    ║");
    console.log("║  corre después: npm run seed:v3                        ║");
    console.log("╚═══════════════════════════════════════════════════════╝\n");
  } catch (err) {
    await qr.rollbackTransaction();
    console.error("❌ Seed admin-psicólogo fallido:", err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
