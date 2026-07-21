import express from "express";
import * as jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../config/db";

const router = express.Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKED_MESSAGE =
  "Cuenta bloqueada por múltiples intentos fallidos. Comunícate con tu psicólogo o el administrador para restablecer tu contraseña.";

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

    if (user.locked_at) {
      return res.status(403).json({ error: LOCKED_MESSAGE });
    }

    // Validar password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const { rows: updatedRows } = await pool.query(
        `UPDATE usuarios
         SET failed_login_attempts = failed_login_attempts + 1,
             locked_at = CASE WHEN failed_login_attempts + 1 >= $2 THEN NOW() ELSE locked_at END
         WHERE id = $1
         RETURNING failed_login_attempts, locked_at`,
        [user.id, MAX_LOGIN_ATTEMPTS]
      );

      const { failed_login_attempts, locked_at } = updatedRows[0];
      if (locked_at) {
        return res.status(403).json({ error: LOCKED_MESSAGE });
      }

      const remaining = MAX_LOGIN_ATTEMPTS - failed_login_attempts;
      return res.status(401).json({
        error: `Credenciales incorrectas. Te queda${remaining === 1 ? "" : "n"} ${remaining} intento${remaining === 1 ? "" : "s"} antes de que se bloquee tu cuenta.`,
      });
    }

    if (user.failed_login_attempts > 0) {
      await pool.query(
        `UPDATE usuarios SET failed_login_attempts = 0, locked_at = NULL WHERE id = $1`,
        [user.id]
      );
    }

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
        debeCambiarPassword: user.debe_cambiar_password,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
