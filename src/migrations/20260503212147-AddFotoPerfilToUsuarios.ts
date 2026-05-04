import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFotoPerfilToUsuarios20260503212147 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil TEXT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios DROP COLUMN IF EXISTS foto_perfil
    `);
  }
}
