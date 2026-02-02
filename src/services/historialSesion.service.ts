import { AppDataSource } from "../config/datasource";
import { HistorialSesion } from "../entities/HistorialSesion.entity";
import { HistorialTratamiento } from "../entities/HistorialTratamiento.entity";
import { encryptText, decryptText, getEncryptionKey } from "../utils/crypto.util";

const repo = AppDataSource.getRepository(HistorialSesion);

const ENCRYPTED_FIELDS = [
  "seguimiento_encrypted",
  "recomendaciones_encrypted",
  "objetivos_proxima_sesion_encrypted",
] as const;

function encryptSesionFields(data: Partial<HistorialSesion>): Partial<HistorialSesion> {
  const key = getEncryptionKey();
  const encrypted = { ...data };

  for (const field of ENCRYPTED_FIELDS) {
    const value = data[field];
    if (value && typeof value === "string" && value.trim() !== "") {
      try {
        const parsed = JSON.parse(value);
        if (parsed.iv && parsed.ciphertext) {
          (encrypted as any)[field] = value;
        } else {
          const encryptedPayload = encryptText(value, key);
          (encrypted as any)[field] = JSON.stringify(encryptedPayload);
        }
      } catch {
        const encryptedPayload = encryptText(value, key);
        (encrypted as any)[field] = JSON.stringify(encryptedPayload);
      }
    }
  }

  return encrypted;
}

function decryptSesionFields(sesion: HistorialSesion): HistorialSesion {
  const key = getEncryptionKey();
  const decrypted = { ...sesion };

  for (const field of ENCRYPTED_FIELDS) {
    const value = (sesion as any)[field];
    if (value && typeof value === "string") {
      try {
        const payload = JSON.parse(value);
        if (payload.iv && payload.ciphertext) {
          (decrypted as any)[field] = decryptText(payload, key);
        }
      } catch (error) {
        // Si no es JSON válido o no se puede desencriptar, dejar el valor original
      }
    }
  }

  return decrypted;
}

export class HistorialSesionService {
  static async getByTratamiento(tratamientoId: string) {
    const sesiones = await repo.find({
      where: {
        tratamiento: { id: tratamientoId },
      },
      relations: ["tratamiento"],
      order: { fecha_sesion: "ASC" },
    });

    return sesiones.map(decryptSesionFields);
  }

  static async create(
    tratamientoId: string,
    data: Partial<HistorialSesion>
  ) {
    const tratamientoRepo =
      AppDataSource.getRepository(HistorialTratamiento);

    const tratamiento = await tratamientoRepo.findOneBy({
      id: tratamientoId,
    });

    if (!tratamiento) {
      throw new Error("Tratamiento no encontrado");
    }

    const encryptedData = encryptSesionFields(data);

    const sesion = repo.create({
      ...encryptedData,
      tratamiento,
    });

    const saved = await repo.save(sesion);
    const result = await repo.findOne({
      where: { id: saved.id },
      relations: ["tratamiento"],
    });

    return result ? decryptSesionFields(result) : null;
  }

  static async update(
    sesionId: string,
    tratamientoId: string,
    data: Partial<HistorialSesion>
  ) {
    const sesion = await repo.findOne({
      where: {
        id: sesionId,
        tratamiento: { id: tratamientoId },
      },
    });

    if (!sesion) {
      throw new Error("Sesión no encontrada");
    }

    const encryptedData = encryptSesionFields(data);
    Object.assign(sesion, encryptedData);
    await repo.save(sesion);

    const result = await repo.findOne({
      where: { id: sesionId },
      relations: ["tratamiento"],
    });

    return result ? decryptSesionFields(result) : null;
  }

  static async finalizar(
    sesionId: string,
    tratamientoId: string
  ) {
    const sesion = await repo.findOne({
      where: {
        id: sesionId,
        tratamiento: { id: tratamientoId },
      },
    });

    if (!sesion) {
      throw new Error("Sesión no encontrada");
    }

    if (sesion.finalizada) {
      throw new Error("La sesión ya está finalizada");
    }

    sesion.finalizada = true;
    sesion.fecha_finalizacion = new Date();
    await repo.save(sesion);

    const result = await repo.findOne({
      where: { id: sesionId },
      relations: ["tratamiento"],
    });

    return result ? decryptSesionFields(result) : null;
  }
}
