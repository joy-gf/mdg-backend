import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from "typeorm";
import { Usuario } from "./Usuario.entity";

@Entity("roles")
export class Rol {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "name", length: 50, unique: true })
  name!: string;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios!: Usuario[];
}
