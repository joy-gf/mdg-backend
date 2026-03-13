import { Request, Response } from "express";
import {
  generateBackup,
  listBackups,
  getBackupFilePath,
} from "../services/backup.service";

export class BackupController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = await generateBackup();
      res.json({ message: "Backup generado exitosamente", filename });
    } catch (err: any) {
      console.error("[Backup] Error al generar backup:", err);
      res.status(500).json({ error: "Error al generar backup", detail: err.message });
    }
  }

  static list(_req: Request, res: Response): void {
    try {
      const backups = listBackups();
      res.json(backups);
    } catch (err: any) {
      res.status(500).json({ error: "Error al listar backups", detail: err.message });
    }
  }

  static download(req: Request, res: Response): void {
    const { filename } = req.params;
    const filepath = getBackupFilePath(filename);

    if (!filepath) {
      res.status(404).json({ error: "Backup no encontrado" });
      return;
    }

    res.download(filepath, filename);
  }
}
