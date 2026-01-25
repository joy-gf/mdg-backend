import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { HistorialTratamiento } from "./HistorialTratamiento.entity";

@Entity("historial_sesion")
export class HistorialSesion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /* RELACIÓN */
  @ManyToOne(
    () => HistorialTratamiento,
    (t) => t.sesiones,
    { onDelete: "CASCADE" }
  )
  tratamiento!: HistorialTratamiento;

  /* DATOS DE SESIÓN */
  @Column({ type: "date", default: () => "CURRENT_DATE" })
  fecha_sesion!: Date;

  @Column({ type: "text", nullable: true, comment: "Encrypted JSON: {iv, ciphertext}" })
  seguimiento_encrypted!: string | null;

  @Column({ type: "text", nullable: true, comment: "Encrypted JSON: {iv, ciphertext}" })
  recomendaciones_encrypted!: string | null;

  @Column({ type: "date", nullable: true })
  fecha_proxima_sesion!: Date | null;

  @Column({ type: "text", nullable: true, comment: "Encrypted JSON: {iv, ciphertext}" })
  objetivos_proxima_sesion_encrypted!: string | null;
}
