import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { AntecedentesPaciente } from "./AntecedentesPaciente.entity";
import { HistorialTratamiento } from "./HistorialTratamiento.entity";

@Entity("pacientes")
export class Paciente {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  usuario_id!: string | null;

  @Column({ length: 120 })
  nombres!: string;

  @Column({ length: 120 })
  apellidos!: string;

  @Column({ type: "date" })
  fecha_nacimiento!: Date;

  @Column({ length: 20, nullable: true })
  sexo!: string;

  @Column({ length: 50, nullable: true })
  escolaridad!: string;

  @Column({ length: 100, nullable: true })
  ocupacion!: string;

  @Column({ length: 20, nullable: true })
  estado_civil!: string;

  @Column({ length: 50, nullable: true })
  telefono!: string;

  @Column({ length: 200, nullable: true })
  contacto_emergencia!: string;

  @Column({ length: 200, nullable: true })
  direccion!: string;

  @CreateDateColumn({ type: "date" })
  fecha_ingreso!: Date;

  /* RELACIONES */
  @OneToMany(() => AntecedentesPaciente, (a) => a.paciente)
  antecedentes!: AntecedentesPaciente[];

  @OneToMany(() => HistorialTratamiento, (t) => t.paciente)
  tratamientos!: HistorialTratamiento[];
}
