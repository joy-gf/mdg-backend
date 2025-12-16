import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { HistorialTratamiento } from "./HistorialTratamiento.entity";

@Entity("psicologos")
export class Psicologo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  usuario_id!: string;

  @Column({ length: 150 })
  nombres!: string;

  @Column({ length: 150 })
  apellidos!: string;

  @Column({ length: 150, nullable: true })
  email!: string;

  @Column({ length: 50, nullable: true })
  telefono!: string;

  @Column({ type: "text", nullable: true })
  direccion!: string;

  @Column({ length: 100, nullable: true })
  ciudad!: string;

  @Column({ type: "text", nullable: true })
  foto_perfil!: string;

  @Column({ type: "date", nullable: true })
  fecha_nacimiento!: Date;

  @Column({ length: 30, nullable: true })
  genero!: string;

  @Column({ length: 30, nullable: true })
  ci!: string;

  @Column({ length: 150, nullable: true })
  profesion!: string;

  @Column({ length: 100, nullable: true })
  matricula_profesional!: string;

  @Column({ length: 150, nullable: true })
  universidad!: string;

  @Column({ type: "int", nullable: true })
  anios_experiencia!: number;

  @Column({ type: "text", nullable: true })
  descripcion!: string;

  @Column({ type: "text", array: true, nullable: true })
  especialidades!: string[];

  @CreateDateColumn({ type: "timestamp" })
  fecha_creacion!: Date;

  @OneToMany(
    () => HistorialTratamiento,
    (t) => t.psicologo
  )
  tratamientos!: HistorialTratamiento[];
}
