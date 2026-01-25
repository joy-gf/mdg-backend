import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";

@Entity("diario_emocional")
export class DiarioEmocional {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  paciente_id!: string;

  @Column({ type: "date" })
  fecha_entrada!: Date;

  @Column({ length: 50 })
  emocion_seleccionada!: string;

  @Column({ type: "text" })
  texto_entrada!: string;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  /* RELACIONES */
  @ManyToOne(() => Paciente, { onDelete: "CASCADE" })
  @JoinColumn({ name: "paciente_id" })
  paciente!: Paciente;
}
