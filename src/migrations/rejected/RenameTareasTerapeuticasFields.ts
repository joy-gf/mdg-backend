import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Rename Tareas Terapeuticas Fields
 *
 * Renombra las columnas tareas_terapeuticas_encrypted y tareas_terapeuticas_list_encrypted
 * para remover el sufijo _encrypted, ya que estos campos no deben estar encriptados
 * (los pacientes necesitan ver sus tareas terapéuticas)
 */
export class RenameTareasTerapeuticasFields1737850000000 implements MigrationInterface {
  name = "RenameTareasTerapeuticasFields1737850000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("📝 Renombrando columnas tareas_terapeuticas...");

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN tareas_terapeuticas_encrypted TO tareas_terapeuticas
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN tareas_terapeuticas_list_encrypted TO tareas_terapeuticas_list
    `);

    console.log("✅ Columnas renombradas exitosamente");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔙 Revirtiendo renombrado de columnas tareas_terapeuticas...");

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN tareas_terapeuticas TO tareas_terapeuticas_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN tareas_terapeuticas_list TO tareas_terapeuticas_list_encrypted
    `);

    console.log("✅ Revertido exitosamente");
  }
}
