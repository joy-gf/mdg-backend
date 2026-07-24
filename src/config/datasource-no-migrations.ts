import "reflect-metadata";
import 'dotenv/config';
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
import { EjerciciosGratitud } from "../entities/EjerciciosGratitud.entity";
import { AnalisisSentimiento } from "../entities/AnalisisSentimiento.entity";
import { RegistroTareasTerapeuticas } from "../entities/RegistroTareasTerapeuticas.entity";
import { PushSubscription } from "../entities/PushSubscription.entity";
import { NotaRapida } from "../entities/NotaRapida.entity";

export const AppDataSourceNoMigrations = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false
  },
  synchronize: false,
  logging: false,
  migrationsRun: false,
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
    EjerciciosGratitud,
    AnalisisSentimiento,
    RegistroTareasTerapeuticas,
    PushSubscription,
    NotaRapida,
  ],
});
