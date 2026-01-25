import { AppDataSource } from "../config/datasource";
import { AntecedentesPaciente } from "../entities/AntecedentesPaciente.entity";
import { Paciente } from "../entities/Paciente.entity";
import { encryptText, decryptText, getEncryptionKey } from "../utils/crypto.util";

const ENCRYPTED_FIELDS = [
  "personales",
  "familiares",
  "medicos_psiquiatricos",
] as const;

function encryptAntecedentesFields(data: Partial<AntecedentesPaciente>): Partial<AntecedentesPaciente> {
  const key = getEncryptionKey();
  const encrypted = { ...data };

  for (const field of ENCRYPTED_FIELDS) {
    const value = data[field];
    if (value && typeof value === "string" && value.trim() !== "") {
      try {
        const encryptedPayload = encryptText(value, key);
        (encrypted as any)[field] = JSON.stringify(encryptedPayload);
      } catch (error) {
        console.error(`Error encriptando campo ${field}:`, error);
      }
    }
  }

  return encrypted;
}

function decryptAntecedentesFields(antecedentes: AntecedentesPaciente): AntecedentesPaciente {
  const key = getEncryptionKey();
  const decrypted = { ...antecedentes };

  for (const field of ENCRYPTED_FIELDS) {
    const value = (antecedentes as any)[field];
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

export class AntecedentesPacienteService {
  private static repo = AppDataSource.getRepository(AntecedentesPaciente);

  static async getAll() {
    const antecedentes = await this.repo.find({ relations: ["paciente"] });
    return antecedentes.map(decryptAntecedentesFields);
  }

  static async getById(id: string) {
    const antecedente = await this.repo.findOne({
      where: { id },
      relations: ["paciente"],
    });
    return antecedente ? decryptAntecedentesFields(antecedente) : null;
  }

  static async getByPacienteId(pacienteId: string) {
    const antecedente = await this.repo.findOne({
      where: { paciente: { id: pacienteId } },
      relations: ["paciente"],
    });
    return antecedente ? decryptAntecedentesFields(antecedente) : null;
  }

  static async create(data: any) {
    const { pacienteId, ...rest } = data;

    if (!pacienteId) {
      throw new Error("pacienteId es requerido");
    }

    const pacienteRepo = AppDataSource.getRepository(Paciente);
    const paciente = await pacienteRepo.findOneBy({ id: pacienteId });

    if (!paciente) {
      throw new Error("Paciente no encontrado");
    }

    const encryptedData = encryptAntecedentesFields(rest);

    const antecedente = this.repo.create({
      ...encryptedData,
      paciente,
    });

    const saved = await this.repo.save(antecedente);
    const result = await this.repo.findOne({
      where: { id: saved.id },
      relations: ["paciente"],
    });

    return result ? decryptAntecedentesFields(result) : null;
  }

  static async update(id: string, data: Partial<AntecedentesPaciente>) {
    const encryptedData = encryptAntecedentesFields(data);
    await this.repo.update(id, encryptedData);

    const result = await this.repo.findOne({
      where: { id },
      relations: ["paciente"],
    });

    return result ? decryptAntecedentesFields(result) : null;
  }

  static delete(id: string) {
    return this.repo.delete(id);
  }
}
