import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";
import { Psicologo } from "./Psicologo.entity";
import { Consultorio } from "./Consultorio.entity";

@Entity("citas")
export class Cita {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Paciente, { nullable: true })
  @JoinColumn({ name: "pacienteId", referencedColumnName: "id" })
  paciente!: Paciente | null;

  @ManyToOne(() => Psicologo, { nullable: false })
  @JoinColumn({ name: "psicologoId", referencedColumnName: "id" })
  psicologo!: Psicologo;

  @ManyToOne(() => Consultorio, { nullable: true })
  @JoinColumn({ name: "consultorioId", referencedColumnName: "id" })
  consultorio!: Consultorio | null;

  @Column({ type: "date" })
  fecha_sesion!: string; // Formato: YYYY-MM-DD

  @Column({ type: "time" })
  hora_sesion!: string; // Formato: HH:mm:ss

  @Column({ type: "int" })
  duracion_minutos!: number;

  @Column({ length: 80 })
  tipo_cita!: string;

  @Column({ length: 200, nullable: true })
  direccion_cita!: string;

  @Column({ length: 200, nullable: true })
  link_cita!: string;

  @Column({ length: 20, default: "activa" })
  estado!: "pendiente" | "activa" | "cancelada" | "rechazada" | "reprogramada" | "finalizada";

  @Column({ length: 20, nullable: true })
  solicitada_por!: "paciente" | "psicologo" | null;

  @Column({ type: "timestamp", nullable: true })
  fecha_confirmacion!: Date | null;

  @Column({ type: "text", nullable: true })
  motivo_rechazo!: string | null;

  @Column({ type: "text", nullable: true })
  notas_cita!: string | null;
}
