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

  static async update(id: string, data: Partial<UsuarioInput>): Promise<Usuario> {
    const { userName, password, roleId } = data;

    // Build dynamic UPDATE query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userName !== undefined) {
      updates.push(`user_name = $${paramIndex}`);
      values.push(userName);
      paramIndex++;
    }

    if (password !== undefined && password !== null && password !== '') {
      // Hash the password before storing (only if provided)
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updates.push(`password_hash = $${paramIndex}`);
      values.push(passwordHash);
      paramIndex++;
    }

    if (roleId !== undefined) {
      updates.push(`role_id = $${paramIndex}`);
      values.push(roleId);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id); // Add id as the last parameter

    const res = await pool.query(
      `UPDATE usuarios
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (res.rows.length === 0) {
      throw new Error("Usuario not found");
    }

    return res.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
  }
}
