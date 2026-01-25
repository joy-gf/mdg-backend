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

  @ManyToOne(() => Paciente, (p) => p.tratamientos, { onDelete: "CASCADE" })
  paciente!: Paciente;

  @ManyToOne(() => Psicologo, (p) => p.tratamientos, { nullable: true, onDelete: "SET NULL" })
  psicologo!: Psicologo | null;

  @OneToMany(() => HistorialSesion, (s) => s.tratamiento)
  sesiones!: HistorialSesion[];

  // Campos clínicos encriptados
  @Column({ type: "text", nullable: true })
  antecedentes_terapeuticos_previos_encrypted!: string | null;

  @Column({ type: "boolean", nullable: true })
  consumo_sustancias!: boolean | null;

  @Column({ type: "text", nullable: true })
  consumo_detalle_encrypted!: string | null;

  @Column({ type: "text", nullable: true })
  observaciones_clinicas_encrypted!: string | null;

  @Column({ type: "text", nullable: true })
  hipotesis_diagnostica_encrypted!: string | null;

  @Column({ type: "text", nullable: true })
  diagnostico_clinico_encrypted!: string | null;

  @Column({ length: 80, nullable: true })
  tipo_intervencion!: string | null;

  @Column({ type: "text", nullable: true })
  objetivo_general_encrypted!: string | null;

  @Column({ type: "text", nullable: true })
  objetivos_especificos_encrypted!: string | null;

  @Column({ type: "text", nullable: true })
  plan_trabajo_encrypted!: string | null;

  @Column({ type: "int", nullable: true })
  numero_sesiones_tentativas!: number | null;

  @Column({ type: "text", nullable: true })
  recomendaciones_iniciales_encrypted!: string | null;

  // Notas adicionales sobre tareas (texto libre)
  @Column({ type: "text", nullable: true })
  tareas_terapeuticas_encrypted!: string | null;

  // Lista de tareas seleccionadas (array)
  @Column({ type: "text", nullable: true })
  tareas_terapeuticas_list_encrypted!: string | null;

  @Column({ type: "date", default: () => "CURRENT_DATE" })
  fecha_inicio!: Date;

  @Column({ type: "date", nullable: true })
  fecha_cierre!: Date | null;

  @Column({ type: "text", nullable: true })
  comentarios_finales_encrypted!: string | null;

  @Column({ default: true })
  activo!: boolean;
}
