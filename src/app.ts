import express from "express";
import cors from "cors";

// rutas
import authRoutes from "./routes/auth.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import consultoriosRoutes from "./routes/consultorios.routes";
import pacientesRoutes from "./routes/pacientes.routes";
import rolesRoutes from "./routes/roles.routes";
import psicologosRoutes from "./routes/psicologos.routes";
import historialTratamientoRoutes from "./routes/historialTratamiento.routes";
import citasRoutes from "./routes/citas.routes";

const app = express();

/* =======================
   Middlewares globales
======================= */
app.use(cors());
app.use(express.json());

/* =======================
   Rutas API
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/consultorios", consultoriosRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/psicologos", psicologosRoutes);
app.use("/api/tratamientos", historialTratamientoRoutes);
app.use("/api/citas", citasRoutes);

/* =======================
   Health check
======================= */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
