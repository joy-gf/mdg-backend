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

@Entity("notas_rapidas")
export class NotaRapida {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  paciente_id!: string;

  @Column({ type: "uuid" })
  psicologo_id!: string;

  @Column({ type: "text" })
  contenido!: string;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  @ManyToOne(() => Paciente, { onDelete: "CASCADE" })
  @JoinColumn({ name: "paciente_id" })
  paciente!: Paciente;
}
