import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotasRapidas20260527000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notas_rapidas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
        psicologo_id UUID NOT NULL,
        contenido TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notas_rapidas_paciente ON notas_rapidas(paciente_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notas_rapidas`);
  }
}
