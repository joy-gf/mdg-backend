import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Encrypt Clinical Data
 *
 * Renames columns in historial_tratamiento and historial_sesion tables
 * to reflect that they now store encrypted data.
 *
 * Security: This migration prepares the database schema for end-to-end
 * encryption of sensitive clinical information.
 *
 * IMPORTANT: Run this migration BEFORE deploying the new application code
 * that expects encrypted field names.
 */
export class EncryptClinicalData1737644400000 implements MigrationInterface {
  name = "EncryptClinicalData1737644400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🔐 Starting encryption migration for clinical data...");

    // ========================================
    // HISTORIAL_TRATAMIENTO TABLE
    // ========================================
    console.log("Updating historial_tratamiento table...");

    // Rename text columns to _encrypted suffix
    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN antecedentes_terapeuticos_previos TO antecedentes_terapeuticos_previos_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN consumo_detalle TO consumo_detalle_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN observaciones_clinicas TO observaciones_clinicas_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN hipotesis_diagnostica TO hipotesis_diagnostica_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN diagnostico_clinico TO diagnostico_clinico_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN objetivo_general TO objetivo_general_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN objetivos_especificos TO objetivos_especificos_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN plan_trabajo TO plan_trabajo_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN recomendaciones_iniciales TO recomendaciones_iniciales_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN tareas_terapeuticas TO tareas_terapeuticas_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN comentarios_finales TO comentarios_finales_encrypted
    `);

    console.log("historial_tratamiento table updated");

    // ========================================
    // HISTORIAL_SESION TABLE
    // ========================================
    console.log("Updating historial_sesion table...");

    await queryRunner.query(`
      ALTER TABLE historial_sesion
      RENAME COLUMN seguimiento TO seguimiento_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_sesion
      RENAME COLUMN recomendaciones TO recomendaciones_encrypted
    `);

    await queryRunner.query(`
      ALTER TABLE historial_sesion
      RENAME COLUMN objetivos_proxima_sesion TO objetivos_proxima_sesion_encrypted
    `);

    console.log("historial_sesion table updated");

    console.log("Clinical data encryption migration completed successfully!");
    console.log("IMPORTANT: All existing data in these fields will need to be encrypted");
    console.log("or cleared. New records will be saved with encryption automatically.");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔓 Reverting encryption migration for clinical data...");

    // ========================================
    // REVERT HISTORIAL_TRATAMIENTO TABLE
    // ========================================
    console.log("Reverting historial_tratamiento table...");

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN antecedentes_terapeuticos_previos_encrypted TO antecedentes_terapeuticos_previos
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN consumo_detalle_encrypted TO consumo_detalle
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN observaciones_clinicas_encrypted TO observaciones_clinicas
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN hipotesis_diagnostica_encrypted TO hipotesis_diagnostica
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN diagnostico_clinico_encrypted TO diagnostico_clinico
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN objetivo_general_encrypted TO objetivo_general
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN objetivos_especificos_encrypted TO objetivos_especificos
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN plan_trabajo_encrypted TO plan_trabajo
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN recomendaciones_iniciales_encrypted TO recomendaciones_iniciales
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN tareas_terapeuticas_encrypted TO tareas_terapeuticas
    `);

    await queryRunner.query(`
      ALTER TABLE historial_tratamiento
      RENAME COLUMN comentarios_finales_encrypted TO comentarios_finales
    `);

    console.log("historial_tratamiento table reverted");

    // ========================================
    // REVERT HISTORIAL_SESION TABLE
    // ========================================
    console.log("Reverting historial_sesion table...");

    await queryRunner.query(`
      ALTER TABLE historial_sesion
      RENAME COLUMN seguimiento_encrypted TO seguimiento
    `);

    await queryRunner.query(`
      ALTER TABLE historial_sesion
      RENAME COLUMN recomendaciones_encrypted TO recomendaciones
    `);

    await queryRunner.query(`
      ALTER TABLE historial_sesion
      RENAME COLUMN objetivos_proxima_sesion_encrypted TO objetivos_proxima_sesion
    `);

    console.log("historial_sesion table reverted");

    console.log("Encryption migration reverted successfully");
  }
}
