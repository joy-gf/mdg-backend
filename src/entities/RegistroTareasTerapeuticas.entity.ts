import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";

export type TipoTareaTerapeutica =
  | "registro_actividades"
  | "ejercicios_gratitud"
  | "higiene_sueno"
  | "ejercicios_respiracion";

@Entity("registro_tareas_terapeuticas")
export class RegistroTareasTerapeuticas {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  paciente_id!: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  tipo_tarea!: TipoTareaTerapeutica;

  @Column({ type: "date" })
  fecha!: Date;

  @Column({ type: "simple-array", nullable: true })
  actividades_realizadas!: string[] | null;

  @Column({ type: "int", default: 0 })
  veces_completado!: number;

  @Column({ type: "int", default: 0 })
  tiempo_total_segundos!: number;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  /* RELACIONES */
  @ManyToOne(() => Paciente, { onDelete: "CASCADE" })
  @JoinColumn({ name: "paciente_id" })
  paciente!: Paciente;
}
