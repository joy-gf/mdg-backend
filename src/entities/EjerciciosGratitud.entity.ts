import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";

@Entity("ejercicios_gratitud")
export class EjerciciosGratitud {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  paciente_id!: string;

  @Column({ type: "date" })
  fecha_entrada!: Date;

  @Column({ type: "text" })
  cosas_buenas!: string;

  @Column({ type: "text" })
  personas_agradecidas!: string;

  @Column({ type: "text" })
  aprendizaje_crecimiento!: string;

  @Column({ type: "text" })
  aspectos_valorados!: string;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  /* RELACIONES */
  @ManyToOne(() => Paciente, { onDelete: "CASCADE" })
  @JoinColumn({ name: "paciente_id" })
  paciente!: Paciente;
}
