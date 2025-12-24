import { ILike } from "typeorm";
import { Paciente } from "../entities/Paciente.entity";
import { AppDataSource } from "../config/datasource";
import { UsuarioInput } from "../types/usuario.types";

interface CreatePacienteWithUserInput {
  usuario: UsuarioInput;
  paciente: Partial<Paciente>;
}

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

  static getByUsuario(usuario_id: string) {
    return this.repo.findOne({ where: { usuario_id } });
  }

  static create(data: Partial<Paciente>) {
    const paciente = this.repo.create(data);
    return this.repo.save(paciente);
  }

  static update(id: string, data: Partial<Paciente>) {
    return this.repo.update(id, data);
  }

  static async createWithUser(data: CreatePacienteWithUserInput) {
    return await AppDataSource.transaction(async (manager) => {
      const role_id = "222b5b78-a1b4-41d7-8ed0-f904afb3f078";
      const { userName, password, roleId } = data.usuario;
      const usuarioResult = await manager.query(
        `INSERT INTO usuarios (user_name, password_hash, role_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userName, password, role_id]
      );
      const usuario = usuarioResult[0];

      // Create paciente with the created usuario_id
      const pacienteData = {
        ...data.paciente,
        usuario_id: usuario.id,
      };
      const paciente = manager.getRepository(Paciente).create(pacienteData);
      const savedPaciente = await manager.getRepository(Paciente).save(paciente);

      return {
        usuario,
        paciente: savedPaciente,
      };
    });
  }
}