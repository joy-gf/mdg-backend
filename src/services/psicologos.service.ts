import { AppDataSource } from "../config/datasource";
import { ILike } from "typeorm";
import { Psicologo } from "../entities/Psicologo.entity";
import { UsuarioInput } from "../types/usuario.types";
import * as bcrypt from "bcrypt";

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
          { nombres: ILike(`%${search}%`), activo: true },
          { apellidos: ILike(`%${search}%`), activo: true },
          { especialidades: ILike(`%${search}%`), activo: true },
        ],
      });
    }
    return this.repo.find({ where: { activo: true } });
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

  static async darDeBaja(id: string) {
    const psicologo = await this.repo.findOne({ where: { id } });
    if (!psicologo) {
      throw {
        status: 404,
        code: "PSICOLOGO_NO_ENCONTRADO",
        message: "El psicólogo no existe",
      };
    }

    await this.repo.update(id, { activo: false });
    return { success: true, message: "Psicólogo dado de baja exitosamente" };
  }

  static async reactivar(id: string) {
    const psicologo = await this.repo.findOne({ where: { id } });
    if (!psicologo) {
      throw {
        status: 404,
        code: "PSICOLOGO_NO_ENCONTRADO",
        message: "El psicólogo no existe",
      };
    }

    await this.repo.update(id, { activo: true });
    return { success: true, message: "Psicólogo reactivado exitosamente" };
  }

  static async addUserToPsicologo(psicologoId: string, userData: UsuarioInput) {
    return await AppDataSource.transaction(async (manager) => {
      const role_id = "8c85856d-137a-4df9-9e96-2b2ff3cebd14"; // PSICOLOGO role
      const { userName, password } = userData;

      // Verificar que el psicólogo existe
      const psicologo = await manager.getRepository(Psicologo).findOne({ where: { id: psicologoId } });
      if (!psicologo) {
        throw {
          status: 404,
          code: "PSICOLOGO_NO_ENCONTRADO",
          message: "El psicólogo no existe",
        };
      }

      // Verificar que el psicólogo no tenga ya un usuario
      if (psicologo.usuario_id) {
        throw {
          status: 409,
          code: "PSICOLOGO_YA_TIENE_USUARIO",
          message: "El psicólogo ya tiene un usuario asociado",
        };
      }

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

      // Hash the password before storing
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Crear el usuario
      const usuarioResult = await manager.query(
        `INSERT INTO usuarios (user_name, password_hash, role_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userName, passwordHash, role_id]
      );
      const usuario = usuarioResult[0];

      // Actualizar el psicólogo con el usuario_id
      await manager.getRepository(Psicologo).update(psicologoId, { usuario_id: usuario.id });

      return {
        usuario,
        psicologo: { ...psicologo, usuario_id: usuario.id },
      };
    });
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

      // Hash the password before storing
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const usuarioResult = await manager.query(
        `INSERT INTO usuarios (user_name, password_hash, role_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userName, passwordHash, role_id]
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
