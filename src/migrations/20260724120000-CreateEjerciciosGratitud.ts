import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEjerciciosGratitud20260724120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ejercicios_gratitud (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
        fecha_entrada DATE NOT NULL,
        cosas_buenas TEXT NOT NULL DEFAULT '',
        personas_agradecidas TEXT NOT NULL DEFAULT '',
        aprendizaje_crecimiento TEXT NOT NULL DEFAULT '',
        aspectos_valorados TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ejercicios_gratitud_paciente ON ejercicios_gratitud(paciente_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ejercicios_gratitud_fecha ON ejercicios_gratitud(fecha_entrada)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ejercicios_gratitud`);
  }
}
