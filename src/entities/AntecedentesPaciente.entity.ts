import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { Paciente } from "./Paciente.entity";

@Entity("antecedentes_paciente")
export class AntecedentesPaciente {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Paciente, (p) => p.antecedentes, { onDelete: "CASCADE" })
  paciente!: Paciente;

  @Column({ type: "text", nullable: true, comment: "Encrypted JSON: {iv, ciphertext}" })
  personales!: string;

  @Column({ type: "text", nullable: true, comment: "Encrypted JSON: {iv, ciphertext}" })
  familiares!: string;

  @Column({ type: "text", nullable: true, comment: "Encrypted JSON: {iv, ciphertext}" })
  medicos_psiquiatricos!: string;
}
