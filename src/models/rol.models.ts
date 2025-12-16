import { pool } from "../config/db";
import { Rol, RolInput } from "../types/rol.types";

export class RolModel {
  static async getAll(): Promise<Rol[]> {
    const res = await pool.query("SELECT * FROM roles ORDER BY id");
    return res.rows;
  }

  static async create(data: RolInput): Promise<Rol> {
    const { name } = data;

    const res = await pool.query(
      `INSERT INTO roles (name)
       VALUES ($1)
       RETURNING *`,
      [name]
    );
    return res.rows[0];
  }

  static async update(id: number, data: RolInput): Promise<Rol> {
    const { name } = data;

    const res = await pool.query(
      `UPDATE roles
       SET name = $1
       WHERE id = $2
       RETURNING *`,
      [name, id]
    );
    return res.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await pool.query("DELETE FROM roles WHERE id = $1", [id]);
  }
}
