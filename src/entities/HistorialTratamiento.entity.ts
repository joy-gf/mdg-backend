import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Paciente } from "./Paciente.entity";
import { Psicologo } from "./Psicologo.entity";
import { HistorialSesion } from "./HistorialSesion.entity";

@Entity("historial_tratamiento")
export class HistorialTratamiento {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /* RELACIONES */
  @ManyToOne(() => Paciente, (p) => p.tratamientos, {
    onDelete: "CASCADE",
  })
  paciente!: Paciente;

  @ManyToOne(() => Psicologo, (p) => p.tratamientos, {
    nullable: true,
    onDelete: "SET NULL",
  })
  psicologo!: Psicologo | null;

  @OneToMany(() => HistorialSesion,
    (s) => s.tratamiento
  )
  sesiones!: HistorialSesion[];

  /* DATOS CLÍNICOS */
  @Column({ type: "text", nullable: true })
  antecedentes_terapeuticos_previos!: string;

  @Column({ type: "boolean", nullable: true })
  consumo_sustancias!: boolean;

  @Column({ type: "text", nullable: true })
  consumo_detalle!: string;

  @Column({ type: "text", nullable: true })
  observaciones_clinicas!: string;

  @Column({ type: "text", nullable: true })
  hipotesis_diagnostica!: string;

  @Column({ type: "text", nullable: true })
  diagnostico_clinico!: string;

  @Column({ length: 80, nullable: true })
  tipo_intervencion!: string;

  @Column({ type: "text", nullable: true })
  objetivo_general!: string;

  @Column({ type: "text", nullable: true })
  objetivos_especificos!: string;

  @Column({ type: "text", nullable: true })
  plan_trabajo!: string;

  @Column({ type: "int", nullable: true })
  numero_sesiones_tentativas!: number;

  @Column({ type: "text", nullable: true })
  recomendaciones_iniciales!: string;

  @Column({ type: "text", nullable: true })
  tareas_terapeuticas!: string;

  /* ESTADO DEL TRATAMIENTO */
  @Column({ type: "date", default: () => "CURRENT_DATE" })
  fecha_inicio!: Date;

  @Column({ type: "date", nullable: true })
  fecha_cierre!: Date | null;

  @Column({ type: "text", nullable: true })
  comentarios_finales!: string | null;

  @Column({ default: true })
  activo!: boolean;
}
