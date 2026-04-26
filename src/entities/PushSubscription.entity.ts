import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("push_subscriptions")
export class PushSubscription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string; // referencias a usuarios.id

  @Column({ type: "text", unique: true })
  endpoint!: string;

  @Column({ type: "text" })
  p256dh!: string;

  @Column({ type: "text" })
  auth!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}
