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
import historialSesionRoutes from "./routes/historialSesion.routes";
import citasRoutes from "./routes/citas.routes";
import antecedentesPacienteRoutes from "./routes/antecedentesPaciente.routes";
import diarioEmocionalRoutes from "./routes/diarioEmocional.routes";
import ejerciciosGratitudRoutes from "./routes/ejerciciosGratitud.routes";
import analisisSentimientoRoutes from "./routes/analisisSentimiento.routes";
import estadisticasRoutes from "./routes/estadisticas.routes";
import registroTareasRoutes from "./routes/registroTareas.routes";
import mensajesDiariosRoutes from "./routes/mensajesDiarios.routes";
import backupRoutes from "./routes/backup.routes";
import pushSubscriptionRoutes from "./routes/pushSubscription.routes";
import notasRapidasRoutes from "./routes/notasRapidas.routes";

const app = express();

/* =======================
   Middlewares globales
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://consultorio-cdp.netlify.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  }
}));

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
app.use("/api/tratamientos", historialSesionRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/antecedentes", antecedentesPacienteRoutes);
app.use("/api/diario-emocional", diarioEmocionalRoutes);
app.use("/api/ejercicios-gratitud", ejerciciosGratitudRoutes);
app.use("/api/analisis", analisisSentimientoRoutes);
app.use("/api/estadisticas", estadisticasRoutes);
app.use("/api/registro-tareas", registroTareasRoutes);
app.use("/api/mensajes-diarios", mensajesDiariosRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/subscriptions", pushSubscriptionRoutes);
app.use("/api/notas-rapidas", notasRapidasRoutes);

/* =======================
   Health check
======================= */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
