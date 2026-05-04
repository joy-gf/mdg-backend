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
      `SELECT u.*, r.name AS role_name,
              COALESCE(p.foto_perfil, u.foto_perfil) AS foto_perfil
       FROM usuarios u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN psicologos p ON p.usuario_id = u.id
       WHERE u.user_name = $1
       LIMIT 1`,
      [user_name]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    // Validar password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Credenciales incorrectas" });

    const JWT_SECRET: Secret = process.env.JWT_SECRET as string;

    const tokenPayload = {
      id: user.id,
      user_name: user.user_name,
      role_id: user.role_id,
      roleName: user.role_name,
      active: user.active,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
    });

    res.json({
      token,
      user: {
        ...tokenPayload,
        avatar: user.foto_perfil ?? null,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
