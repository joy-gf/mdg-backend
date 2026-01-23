import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Paciente } from "./Paciente.entity";

/**
 * DiarioEmocional - Emotional diary entries
 *
 * Security:
 * - texto_entrada is stored ENCRYPTED in database
 * - Only the patient can read/create their own entries
 * - NO updates or deletes allowed (clinical data integrity)
 */
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

  /**
   * Encrypted text content
   * Format: JSON string with { iv: string, ciphertext: string }
   */
  @Column({ type: "text" })
  texto_entrada_encrypted!: string;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  /* RELACIONES */
  @ManyToOne(() => Paciente, { onDelete: "CASCADE" })
  @JoinColumn({ name: "paciente_id" })
  paciente!: Paciente;
}
