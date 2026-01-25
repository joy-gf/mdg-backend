import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add Tareas Terapeuticas List
 *
 */
export class AddTareasTerapeuticasList1737767000000 implements MigrationInterface {
  name = "AddTareasTerapeuticasList1737767000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("📝 Adding tareas_terapeuticas_list_encrypted column...");

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      ADD COLUMN tareas_terapeuticas_list_encrypted TEXT NULL
    `);

    console.log("Column added successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔙 Removing tareas_terapeuticas_list_encrypted column...");

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      DROP COLUMN tareas_terapeuticas_list_encrypted
    `);

    console.log("Column removed successfully");
  }
}
