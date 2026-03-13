import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as cron from "node-cron";
import { deriveKey, encryptText } from "../utils/crypto.util";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");
const BACKUP_SALT = "mdg-backup-salt";

function getBackupKey(): Buffer {
  const secret =
    process.env.BACKUP_SECRET ||
    process.env.ENCRYPTION_SECRET ||
    "default-dev-secret-change-in-production";
  return deriveKey(secret, BACKUP_SALT);
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function cleanOldBackups(daysToKeep = 30) {
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  fs.readdirSync(BACKUP_DIR).forEach((file) => {
    const filepath = path.join(BACKUP_DIR, file);
    if (fs.statSync(filepath).mtimeMs < cutoff) {
      fs.unlinkSync(filepath);
      console.log(`[Backup] Eliminado backup antiguo: ${file}`);
    }
  });
}

export async function generateBackup(): Promise<{ filepath: string; filename: string }> {
  ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sqlFilename = `backup-${timestamp}.sql`;
  const sqlFilepath = path.join(BACKUP_DIR, sqlFilename);
  const encFilename = `${sqlFilename}.enc`;
  const encFilepath = path.join(BACKUP_DIR, encFilename);

  // Generar dump de PostgreSQL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL no configurado");

  await execAsync(`pg_dump "${databaseUrl}" -f "${sqlFilepath}"`);

  // Encriptar el dump con AES-256-GCM
  const key = getBackupKey();
  const sqlContent = fs.readFileSync(sqlFilepath, "utf8");
  const encrypted = encryptText(sqlContent, key);
  fs.writeFileSync(encFilepath, JSON.stringify(encrypted), "utf8");

  // Eliminar el SQL sin encriptar
  fs.unlinkSync(sqlFilepath);

  // Limpiar backups de más de 30 días
  cleanOldBackups(30);

  return { filepath: encFilepath, filename: encFilename };
}

export function listBackups(): { filename: string; sizeKB: number; createdAt: Date }[] {
  ensureBackupDir();
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".enc"))
    .map((filename) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, filename));
      return {
        filename,
        sizeKB: Math.round(stat.size / 1024),
        createdAt: stat.birthtime,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getBackupFilePath(filename: string): string | null {
  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath) || !filename.endsWith(".enc")) return null;
  return filepath;
}

export function scheduleBackups() {
  // Cada día a las 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      const { filename } = await generateBackup();
      console.log(`[Backup] Backup automático generado: ${filename}`);
    } catch (err) {
      console.error("[Backup] Error en backup automático:", err);
    }
  });

  console.log("[Backup] Scheduler configurado — backup diario a las 2:00 AM");
}
