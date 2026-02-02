import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";

interface JWTPayload {
  id: string;
  user_name: string;
  role_id: string;
  roleName: string;
  active: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token no proporcionado",
      });
      return;
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const JWT_SECRET: Secret = process.env.JWT_SECRET as string;

    if (!JWT_SECRET) {
      console.error("JWT_SECRET no está configurado en las variables de entorno");
      res.status(500).json({
        error: "SERVER_ERROR",
        message: "Error de configuración del servidor",
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        error: "INVALID_TOKEN",
        message: "Token inválido",
      });
      return;
    }

    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "Token expirado",
      });
      return;
    }

    res.status(500).json({
      error: "SERVER_ERROR",
      message: "Error al validar el token",
    });
  }
};
