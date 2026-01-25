import { AppDataSource } from "../config/datasource";
import { AntecedentesPaciente } from "../entities/AntecedentesPaciente.entity";
import { Paciente } from "../entities/Paciente.entity";

export class AntecedentesPacienteService {
  private static repo = AppDataSource.getRepository(AntecedentesPaciente);

  static getAll() {
    return this.repo.find({ relations: ["paciente"] });
  }

  static getById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ["paciente"],
    });
  }

  static getByPacienteId(pacienteId: string) {
    return this.repo.findOne({
      where: { paciente: { id: pacienteId } },
      relations: ["paciente"],
    });
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

    const antecedente = this.repo.create({
      ...rest,
      paciente,
    });

    const saved = await this.repo.save(antecedente);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ["paciente"],
    });
  }

  static async update(id: string, data: Partial<AntecedentesPaciente>) {
    await this.repo.update(id, data);
    return this.repo.findOne({
      where: { id },
      relations: ["paciente"],
    });
  }

  static delete(id: string) {
    return this.repo.delete(id);
  }
}
