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

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: "created_date" })
  createdDate!: Date;

  @UpdateDateColumn({ name: "updated_date" })
  updatedDate!: Date;
}
