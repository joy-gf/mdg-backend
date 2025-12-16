import express from "express";
import * as jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../config/db";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { user_name, password } = req.body;

    // 🔥 AHORA CON JOIN PARA TRAER EL ROL
    const { rows } = await pool.query(
      `SELECT u.*, r.name AS role_name
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.user_name = $1
       LIMIT 1`,
      [user_name]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    // Validar password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Credenciales incorrectas" });

    // Payload completo con rol
    const payload = {
      id: user.id,
      user_name: user.user_name,
      rol_id: user.rol_id,
      roleName: user.role_name,
      active: user.active,
    };

    const JWT_SECRET: Secret = process.env.JWT_SECRET as string;

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({
      token,
      user: payload,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
