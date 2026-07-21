import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDebeCambiarPasswordToUsuarios20260720120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios
        DROP COLUMN IF EXISTS debe_cambiar_password
    `);
  }
}
