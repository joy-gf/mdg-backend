import { ILike } from "typeorm";
import { Paciente } from "../entities/Paciente.entity";
import { AppDataSource } from "../config/datasource";
import { UsuarioInput } from "../types/usuario.types";
import * as bcrypt from "bcrypt";

interface CreatePacienteWithUserInput {
  usuario: UsuarioInput;
  paciente: Partial<Paciente>;
}

export class PacientesService {
  private static repo = AppDataSource.getRepository(Paciente);

  static getAll(search?: string, psicologoId?: string) {
    const baseWhere: any = { activo: true };

    if (psicologoId) {
      baseWhere.psicologo_id = psicologoId;
    }

    if (search) {
      return this.repo.find({
        where: [
          { ...baseWhere, nombres: ILike(`%${search}%`) },
          { ...baseWhere, apellidos: ILike(`%${search}%`) },
        ],
      });
    }
    return this.repo.find({ where: baseWhere });
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
        message: `Ya existe un paciente registrado con el CI ${ci}`,
        ci: ci,
      };
    }
  }

  static async create(data: Partial<Paciente>) {
    // Validar CI requerido
    if (!data.ci || data.ci.trim() === "") {
      throw {
        status: 400,
        code: "CI_REQUERIDO",
        message: "El CI (Cédula de Identidad) es requerido",
      };
    }

    // Validar CI único
    await this.validateCIUnique(data.ci);

    const paciente = this.repo.create(data);
    return this.repo.save(paciente);
  }

  static update(id: string, data: Partial<Paciente>) {
    return this.repo.update(id, data);
  }

  static async darDeBaja(id: string) {
    const paciente = await this.repo.findOne({ where: { id } });
    if (!paciente) {
      throw {
        status: 404,
        code: "PACIENTE_NO_ENCONTRADO",
        message: "El paciente no existe",
      };
    }

    await this.repo.update(id, { activo: false });
    return { success: true, message: "Paciente dado de baja exitosamente" };
  }

  static async reactivar(id: string) {
    const paciente = await this.repo.findOne({ where: { id } });
    if (!paciente) {
      throw {
        status: 404,
        code: "PACIENTE_NO_ENCONTRADO",
        message: "El paciente no existe",
      };
    }

    await this.repo.update(id, { activo: true });
    return { success: true, message: "Paciente reactivado exitosamente" };
  }

  static async addUserToPaciente(pacienteId: string, userData: UsuarioInput) {
    return await AppDataSource.transaction(async (manager) => {
      const role_id = "222b5b78-a1b4-41d7-8ed0-f904afb3f078"; // PACIENTE role
      const { userName, password } = userData;

      // Verificar que el paciente existe
      const paciente = await manager.getRepository(Paciente).findOne({ where: { id: pacienteId } });
      if (!paciente) {
        throw {
          status: 404,
          code: "PACIENTE_NO_ENCONTRADO",
          message: "El paciente no existe",
        };
      }

      // Verificar que el paciente no tenga ya un usuario
      if (paciente.usuario_id) {
        throw {
          status: 409,
          code: "PACIENTE_YA_TIENE_USUARIO",
          message: "El paciente ya tiene un usuario asociado",
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

      // Actualizar el paciente con el usuario_id
      await manager.getRepository(Paciente).update(pacienteId, { usuario_id: usuario.id });

      return {
        usuario,
        paciente: { ...paciente, usuario_id: usuario.id },
      };
    });
  }

  static async createWithUser(data: CreatePacienteWithUserInput) {
    // Validar CI requerido antes de iniciar transacción
    if (!data.paciente.ci || data.paciente.ci.trim() === "") {
      throw {
        status: 400,
        code: "CI_REQUERIDO",
        message: "El CI (Cédula de Identidad) es requerido",
      };
    }

    // Validar CI único antes de iniciar transacción
    await this.validateCIUnique(data.paciente.ci);

    return await AppDataSource.transaction(async (manager) => {
      const role_id = "222b5b78-a1b4-41d7-8ed0-f904afb3f078";
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