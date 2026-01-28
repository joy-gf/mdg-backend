import "reflect-metadata";
import { DataSource } from "typeorm";
import { Consultorio } from "../entities/Consultorio.entity";
import { Paciente } from "../entities/Paciente.entity";
import { AntecedentesPaciente } from "../entities/AntecedentesPaciente.entity";
import { HistorialTratamiento } from "../entities/HistorialTratamiento.entity";
import { HistorialSesion } from "../entities/HistorialSesion.entity";
import { Psicologo } from "../entities/Psicologo.entity";
import { Cita } from "../entities/Cita.entity";
import { Usuario } from "../entities/Usuario.entity";
import { Rol } from "../entities/Rol.entity";
import { DiarioEmocional } from "../entities/DiarioEmocional.entity";
import { AnalisisSentimiento } from "../entities/AnalisisSentimiento.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
//   username: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME,
  url: process.env.DATABASE_URL,

  synchronize: false,
  logging: true,
  migrationsRun: true,
  entities: [
    Consultorio,
    Paciente,
    AntecedentesPaciente,
    HistorialTratamiento,
    HistorialSesion,
    Psicologo,
    Cita,
    Usuario,
    Rol,
    DiarioEmocional,
    AnalisisSentimiento
  ],
  migrations: ["src/migrations/*.ts"],
});
