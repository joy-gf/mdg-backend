import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoginLockoutToUsuarios20260718120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios
        DROP COLUMN IF EXISTS failed_login_attempts,
        DROP COLUMN IF EXISTS locked_at
    `);
  }
}
