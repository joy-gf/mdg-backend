import { AppDataSource } from "../config/datasource";
import { AntecedentesPaciente } from "../entities/AntecedentesPaciente.entity";

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

  static create(data: Partial<AntecedentesPaciente>) {
    const antecedente = this.repo.create(data);
    return this.repo.save(antecedente);
  }

  static update(id: string, data: Partial<AntecedentesPaciente>) {
    return this.repo.update(id, data);
  }

  static delete(id: string) {
    return this.repo.delete(id);
  }
}
