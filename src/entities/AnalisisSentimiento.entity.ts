import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { DiarioEmocional } from "./DiarioEmocional.entity";
import { Paciente } from "./Paciente.entity";

// Transformer para convertir decimales de PostgreSQL (strings) a números
const DecimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};

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

  @Column({ type: "decimal", precision: 5, scale: 4, transformer: DecimalTransformer })
  confianza!: number;

  @Column({ type: "decimal", precision: 5, scale: 4, default: 0, transformer: DecimalTransformer })
  score_positivo!: number;

  @Column({ type: "decimal", precision: 5, scale: 4, default: 0, transformer: DecimalTransformer })
  score_negativo!: number;

  @Column({ type: "decimal", precision: 5, scale: 4, default: 0, transformer: DecimalTransformer })
  score_neutral!: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  emocion_predominante!: string | null;

  @Column({ type: "jsonb", nullable: true })
  palabras_clave!: Array<{ word: string; frequency: number }> | null;

  @Column({ type: "jsonb", nullable: true })
  alertas!: Array<{ type: string; text: string }> | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  modelo_usado!: string | null;

  @Column({ type: "text", nullable: true })
  nota_validacion_psicologo!: string | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}
