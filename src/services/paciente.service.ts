import { ILike } from "typeorm";
import { Paciente } from "../entities/Paciente.entity";
import { AppDataSource } from "../config/datasource";

export class PacientesService {
  private static repo = AppDataSource.getRepository(Paciente);

  static getAll(search?: string) {
    if (search) {
      return this.repo.find({
        where: [
          { nombres: ILike(`%${search}%`) },
          { apellidos: ILike(`%${search}%`) },
        ],
      });
    }
    return this.repo.find();
  }

  static getById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ["tratamientos"],
    });
  }

  static create(data: Partial<Paciente>) {
    const paciente = this.repo.create(data);
    return this.repo.save(paciente);
  }

  static update(id: string, data: Partial<Paciente>) {
    return this.repo.update(id, data);
  }
}