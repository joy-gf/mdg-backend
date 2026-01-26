import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { DiarioEmocional } from "./DiarioEmocional.entity";
import { Paciente } from "./Paciente.entity";

@Entity("analisis_sentimiento")
export class AnalisisSentimiento {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  diario_emocional_id!: string;

  @ManyToOne(() => DiarioEmocional, { onDelete: "CASCADE" })
  @JoinColumn({ name: "diario_emocional_id" })
  diarioEmocional!: DiarioEmocional;

  @Column({ type: "uuid" })
  paciente_id!: string;

  @ManyToOne(() => Paciente, { onDelete: "CASCADE" })
  @JoinColumn({ name: "paciente_id" })
  paciente!: Paciente;

  @Column({ type: "date" })
  fecha_analisis!: string;

  @Column({ type: "varchar", length: 20 })
  sentimiento_general!: "esperanzador" | "desafiante" | "equilibrado";

  @Column({ type: "decimal", precision: 5, scale: 4 })
  confianza!: number;

  @Column({ type: "decimal", precision: 5, scale: 4, default: 0 })
  score_positivo!: number;

  @Column({ type: "decimal", precision: 5, scale: 4, default: 0 })
  score_negativo!: number;

  @Column({ type: "decimal", precision: 5, scale: 4, default: 0 })
  score_neutral!: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  emocion_predominante!: string | null;

  @Column({ type: "jsonb", nullable: true })
  palabras_clave!: Array<{ word: string; frequency: number }> | null;

  @Column({ type: "jsonb", nullable: true })
  alertas!: Array<{ type: string; text: string }> | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  modelo_usado!: string | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}
