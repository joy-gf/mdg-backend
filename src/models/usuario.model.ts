import { pool } from "../config/db";
import { Usuario, UsuarioInput } from "../types/usuario.types";
import * as bcrypt from "bcrypt";

export class UsuarioModel {
  static async getAll(): Promise<Usuario[]> {
    const res = await pool.query("SELECT * FROM usuarios ORDER BY id");
    return res.rows;
  }

  static async getUsuarioById(id: string): Promise<Usuario | undefined> {
    const res = await pool.query(
      `SELECT * FROM usuarios WHERE id = $1`,
      [id]
    );

    return res.rows[0];
  }

  static async create(data: UsuarioInput): Promise<Usuario> {
    const { userName, password, roleId } = data;

    // Hash the password before storing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const res = await pool.query(
      `INSERT INTO usuarios (user_name, password_hash, role_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userName, passwordHash, roleId]
    );
    return res.rows[0];
  }

  static async update(id: string, data: UsuarioInput): Promise<Usuario> {
    const { userName, password } = data;

    // Hash the password before storing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const res = await pool.query(
      `UPDATE usuarios
       SET user_name = $1, password_hash = $2
       WHERE id = $3
       RETURNING *`,
      [userName, passwordHash, id]
    );
    return res.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
  }
}
