import { AppDataSource } from "../config/datasource";
import { ILike } from "typeorm";
import { Psicologo } from "../entities/Psicologo.entity";
import { UsuarioInput } from "../types/usuario.types";

interface CreatePsicologoWithUserInput {
  usuario: UsuarioInput;
  psicologo: Partial<Psicologo>;
}

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

  static async createWithUser(data: CreatePsicologoWithUserInput) {
    return await AppDataSource.transaction(async (manager) => {
      const role_id = "8c85856d-137a-4df9-9e96-2b2ff3cebd14";
      const { userName, password, roleId } = data.usuario;
      const usuarioResult = await manager.query(
        `INSERT INTO usuarios (user_name, password_hash, role_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userName, password, role_id]
      );
      const usuario = usuarioResult[0];

      // Create psicologo with the created usuario_id
      const psicologoData = {
        ...data.psicologo,
        usuario_id: usuario.id,
      };
      const psicologo = manager.getRepository(Psicologo).create(psicologoData);
      const savedPsicologo = await manager.getRepository(Psicologo).save(psicologo);

      return {
        usuario,
        psicologo: savedPsicologo,
      };
    });
  }
}
