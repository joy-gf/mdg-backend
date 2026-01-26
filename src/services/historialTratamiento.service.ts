import { AppDataSource } from "../config/datasource";
import { HistorialTratamiento } from "../entities/HistorialTratamiento.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Psicologo } from "../entities/Psicologo.entity";
import { encryptText, decryptText, getEncryptionKey } from "../utils/crypto.util";

const repo = AppDataSource.getRepository(HistorialTratamiento);

// Campos clínicos que deben encriptarse (excepto tareas que el paciente necesita ver)
const ENCRYPTED_FIELDS = [
  "antecedentes_terapeuticos_previos_encrypted",
  "consumo_detalle_encrypted",
  "observaciones_clinicas_encrypted",
  "hipotesis_diagnostica_encrypted",
  "diagnostico_clinico_encrypted",
  "objetivo_general_encrypted",
  "objetivos_especificos_encrypted",
  "plan_trabajo_encrypted",
  "recomendaciones_iniciales_encrypted",
  "comentarios_finales_encrypted",
] as const;

function encryptTratamientoFields(data: Partial<HistorialTratamiento>): Partial<HistorialTratamiento> {
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

  if ((encrypted as any).tareas_terapeuticas_list) {
    if (Array.isArray((encrypted as any).tareas_terapeuticas_list)) {
      (encrypted as any).tareas_terapeuticas_list = JSON.stringify((encrypted as any).tareas_terapeuticas_list);
    } else if (typeof (encrypted as any).tareas_terapeuticas_list === "string") {
      try {
        JSON.parse((encrypted as any).tareas_terapeuticas_list);
      } catch {
        (encrypted as any).tareas_terapeuticas_list = JSON.stringify([]);
      }
    }
  }

  return encrypted;
}

function decryptTratamientoFields(tratamiento: HistorialTratamiento): HistorialTratamiento {
  const key = getEncryptionKey();
  const decrypted = { ...tratamiento };

  for (const field of ENCRYPTED_FIELDS) {
    const value = (tratamiento as any)[field];
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

  if ((decrypted as any).tareas_terapeuticas_list && typeof (decrypted as any).tareas_terapeuticas_list === "string") {
    try {
      (decrypted as any).tareas_terapeuticas_list = JSON.parse((decrypted as any).tareas_terapeuticas_list);
    } catch (error) {
      (decrypted as any).tareas_terapeuticas_list = [];
    }
  }

  return decrypted;
}

export class HistorialTratamientoService {
  static async getByPaciente(pacienteId: string) {
    const tratamientos = await repo.find({
      where: {
        paciente: { id: pacienteId },
      },
      relations: ["paciente", "psicologo"],
      order: { fecha_inicio: "DESC" },
    });

    return tratamientos.map(decryptTratamientoFields);
  }

  /** Obtener un tratamiento con sesiones */
  static async getById(id: string) {
    const tratamiento = await repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo", "sesiones"],
    });

    if (!tratamiento) return null;
    return decryptTratamientoFields(tratamiento);
  }

  static async create(
    pacienteId: string,
    psicologoId: string | null,
    data: Partial<HistorialTratamiento>
  ) {
    const pacienteRepo = AppDataSource.getRepository(Paciente);
    const psicologoRepo = AppDataSource.getRepository(Psicologo);

    const paciente = await pacienteRepo.findOneBy({ id: pacienteId });
    if (!paciente) throw new Error("Paciente no encontrado");

    const psicologo = psicologoId
      ? await psicologoRepo.findOneBy({ id: psicologoId })
      : null;

    const encryptedData = encryptTratamientoFields(data);

    const tratamiento = repo.create({
      ...encryptedData,
      paciente,
      psicologo,
    });

    const saved = await repo.save(tratamiento);
    const result = await repo.findOne({
      where: { id: saved.id },
      relations: ["paciente", "psicologo"],
    });

    return result ? decryptTratamientoFields(result) : null;
  }

  static async update(id: string, data: Partial<HistorialTratamiento>) {
    const tratamiento = await repo.findOneBy({ id });
    if (!tratamiento) throw new Error("Tratamiento no encontrado");

    const encryptedData = encryptTratamientoFields(data);
    Object.assign(tratamiento, encryptedData);
    await repo.save(tratamiento);

    const result = await repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo"],
    });

    return result ? decryptTratamientoFields(result) : null;
  }

  static async cerrar(id: string, comentarios_finales_encrypted?: string) {
    const tratamiento = await repo.findOneBy({ id });
    if (!tratamiento) throw new Error("Tratamiento no encontrado");

    tratamiento.activo = false;
    tratamiento.fecha_cierre = new Date().toISOString().split('T')[0] as any;

    if (comentarios_finales_encrypted) {
      const key = getEncryptionKey();
      const encrypted = encryptText(comentarios_finales_encrypted, key);
      tratamiento.comentarios_finales_encrypted = JSON.stringify(encrypted);
    } else {
      tratamiento.comentarios_finales_encrypted = null;
    }

    await repo.save(tratamiento);
    const result = await repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo"],
    });

    return result ? decryptTratamientoFields(result) : null;
  }
}
