import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn
} from "typeorm";
import { Rol } from "./Rol.entity";

@Entity("usuarios")
export class Usuario {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_name", length: 150, unique: true })
  userName!: string;

  @Column({ name: "password_hash", type: "text" })
  passwordHash!: string;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { eager: true })
  @JoinColumn({ name: "role_id" })
  rol!: Rol;

  @Column({ type: "text", nullable: true })
  foto_perfil!: string | null;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: "failed_login_attempts", default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: "locked_at", type: "timestamp", nullable: true })
  lockedAt!: Date | null;

  @Column({ name: "debe_cambiar_password", default: false })
  debeCambiarPassword!: boolean;

  @CreateDateColumn({ name: "created_date" })
  createdDate!: Date;

  @UpdateDateColumn({ name: "updated_date" })
  updatedDate!: Date;
}
