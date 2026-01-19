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

  static async validateCIUnique(ci: string, excludeId?: string): Promise<void> {
    const query: any = { ci };
    const existing = await this.repo.findOne({ where: query });

    if (existing && (!excludeId || existing.id !== excludeId)) {
      throw {
        status: 409,
        code: "CI_DUPLICADO",
        message: `Ya existe un psicólogo registrado con el CI ${ci}`,
        ci: ci,
      };
    }
  }

  static async create(data: Partial<Psicologo>) {
    // Validar CI requerido
    if (!data.ci || data.ci.trim() === "") {
      throw {
        status: 400,
        code: "CI_REQUERIDO",
        message: "El CI (Cédula de Identidad) es requerido",
      };
    }

    // Validar matrícula profesional requerida
    if (!data.matricula_profesional || data.matricula_profesional.trim() === "") {
      throw {
        status: 400,
        code: "MATRICULA_REQUERIDA",
        message: "La matrícula profesional es requerida",
      };
    }

    // Validar CI único
    await this.validateCIUnique(data.ci);

    const psico = this.repo.create(data);
    return this.repo.save(psico);
  }

  static update(id: string, data: Partial<Psicologo>) {
    return this.repo.update(id, data);
  }

  static async createWithUser(data: CreatePsicologoWithUserInput) {
    // Validar CI requerido antes de iniciar transacción
    if (!data.psicologo.ci || data.psicologo.ci.trim() === "") {
      throw {
        status: 400,
        code: "CI_REQUERIDO",
        message: "El CI (Cédula de Identidad) es requerido",
      };
    }

    // Validar matrícula profesional requerida
    if (!data.psicologo.matricula_profesional || data.psicologo.matricula_profesional.trim() === "") {
      throw {
        status: 400,
        code: "MATRICULA_REQUERIDA",
        message: "La matrícula profesional es requerida",
      };
    }

    // Validar CI único antes de iniciar transacción
    await this.validateCIUnique(data.psicologo.ci);

    return await AppDataSource.transaction(async (manager) => {
      const role_id = "8c85856d-137a-4df9-9e96-2b2ff3cebd14";
      const { userName, password, roleId } = data.usuario;

      // Verificar que el username no existe
      const existingUser = await manager.query(
        `SELECT id FROM usuarios WHERE user_name = $1`,
        [userName]
      );

      if (existingUser.length > 0) {
        throw {
          status: 409,
          code: "USERNAME_DUPLICADO",
          message: `El nombre de usuario ${userName} ya existe`,
          userName: userName,
        };
      }

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
