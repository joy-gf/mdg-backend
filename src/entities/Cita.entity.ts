import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { Paciente } from "./Paciente.entity";
import { Psicologo } from "./Psicologo.entity";
import { Consultorio } from "./Consultorio.entity";

@Entity("citas")
export class Cita {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Paciente, { nullable: false })
  paciente!: Paciente;

  @ManyToOne(() => Psicologo, { nullable: false })
  psicologo!: Psicologo;

  @ManyToOne(() => Consultorio, { nullable: true })
  consultorio!: Consultorio | null;

  @Column({ type: "timestamp" })
  fecha_sesion!: Date;

  @Column({ type: "timestamp" })
  hora_sesion!: Date;

  @Column({ type: "int" })
  duracion_minutos!: number;

  @Column({ length: 80 })
  tipo_cita!: string;

  @Column({ length: 200, nullable: true })
  direccion_cita!: string;

  @Column({ length: 200, nullable: true })
  link_cita!: string;

  @Column({ length: 20, default: "activa" })
  estado!: "activa" | "cancelada" | "reprogramada" | "finalizada";
}
