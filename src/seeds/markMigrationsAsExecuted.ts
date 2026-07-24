import "reflect-metadata";
import "dotenv/config";
import { AppDataSourceNoMigrations } from "../config/datasource-no-migrations";

const MIGRATIONS = [
  { name: "InitDatabase", timestamp: 1680000000000 },
  { name: "InitialSchema", timestamp: 1699999999999 },
  { name: "FixCamelCaseColumnNames", timestamp: 1743800000000 },
  { name: "AddPushSubscriptions", timestamp: 1744200000000 },
  { name: "AddFotoPerfilToUsuarios", timestamp: 20260503212147 },
  { name: "CreateNotasRapidas", timestamp: 20260527000001 },
  { name: "AddLoginLockoutToUsuarios", timestamp: 20260718120000 },
  { name: "AddDebeCambiarPasswordToUsuarios", timestamp: 20260720120000 },
  { name: "CreateEjerciciosGratitud", timestamp: 20260724120000 },
];

async function main() {
  await AppDataSourceNoMigrations.initialize();
  const qr = AppDataSourceNoMigrations.createQueryRunner();
  await qr.connect();

  try {
    // Crear tabla de migraciones si no existe
    await qr.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        timestamp BIGINT NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    `);

    // Marcar migraciones como ejecutadas
    for (const migration of MIGRATIONS) {
      const exists = await qr.query(
        `SELECT * FROM migrations WHERE name = $1`,
        [migration.name]
      );

      if (!exists || exists.length === 0) {
        await qr.query(
          `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
          [migration.timestamp, migration.name]
        );
        console.log(`✓ Migración marcada como ejecutada: ${migration.name}`);
      } else {
        console.log(`ℹ Migración ya marcada: ${migration.name}`);
      }
    }

    console.log("\n✅ Todas las migraciones han sido marcadas como ejecutadas");
  } catch (err) {
    console.error("❌ Error marcando migraciones:", err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSourceNoMigrations.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
