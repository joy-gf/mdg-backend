import { pool } from "../config/db";
import { Consultorio, ConsultorioInput } from "../types/consultorio.types";

export class ConsultorioModel {
  static async getAll(): Promise<Consultorio[]> {
    const res = await pool.query("SELECT * FROM consultorios ORDER BY id");
    return res.rows;
  }

  static async create(data: ConsultorioInput): Promise<Consultorio> {
    const { name } = data;

    const res = await pool.query(
      `INSERT INTO consultorios (name)
       VALUES ($1)
       RETURNING *`,
      [name]
    );
    return res.rows[0];
  }

  static async update(id: number, data: ConsultorioInput): Promise<Consultorio> {
    const { name } = data;

    const res = await pool.query(
      `UPDATE consultorios
       SET name = $1
       WHERE id = $2
       RETURNING *`,
      [name, id]
    );
    return res.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await pool.query("DELETE FROM consultorios WHERE id = $1", [id]);
  }
}
