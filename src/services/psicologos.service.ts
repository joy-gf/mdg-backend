import { AppDataSource } from "../config/datasource";
import { ILike } from "typeorm";
import { Psicologo } from "../entities/Psicologo.entity";

export class PsicologosService {
  private static repo = AppDataSource.getRepository(Psicologo);

  static getAll(search?: string) {
    if (search) {
      return this.repo.find({
        where: [
          { nombres: ILike(`%${search}%`) },
          { apellidos: ILike(`%${search}%`) },
          { especialidades: ILike(`%${search}%`) },
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

  static getByUsuario(usuario_id: string) {
    return this.repo.findOne({ where: { usuario_id } });
  }

  static create(data: Partial<Psicologo>) {
    const psico = this.repo.create(data);
    return this.repo.save(psico);
  }

  static update(id: string, data: Partial<Psicologo>) {
    return this.repo.update(id, data);
  }
}
