import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "consultorios" })
export class Consultorio {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ default: true })
  active!: boolean;
}
