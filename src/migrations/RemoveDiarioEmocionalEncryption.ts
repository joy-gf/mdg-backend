import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Remove Diario Emocional Encryption
 *
 * Renames texto_entrada_encrypted back to texto_entrada in diario_emocional table
 * because we're removing client-side encryption to allow:
 * - Psychologists to read entries from their assigned patients
 * - ML sentiment analysis service to process entries
 *
 * IMPORTANT: Any existing encrypted data in texto_entrada_encrypted will need
 * to be decrypted and migrated before running this migration, or data will be lost.
 */
export class RemoveDiarioEmocionalEncryption1737820000000 implements MigrationInterface {
  name = "RemoveDiarioEmocionalEncryption1737820000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🔓 Removiendo encriptación de diario emocional...");

    // Check if the old column exists before renaming
    const table = await queryRunner.getTable("diario_emocional");
    const oldColumn = table?.findColumnByName("texto_entrada_encrypted");

    if (oldColumn) {
      await queryRunner.query(`
        ALTER TABLE diario_emocional
        RENAME COLUMN texto_entrada_encrypted TO texto_entrada
      `);
      console.log("✓ Columna texto_entrada_encrypted renombrada a texto_entrada");
    } else {
      console.log("⚠ Columna texto_entrada_encrypted no existe, omitiendo...");
    }

    console.log("✓ Migración completada: diario emocional ahora usa texto plano");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("🔐 Revirtiendo: agregando encriptación a diario emocional...");

    const table = await queryRunner.getTable("diario_emocional");
    const newColumn = table?.findColumnByName("texto_entrada");

    if (newColumn) {
      await queryRunner.query(`
        ALTER TABLE diario_emocional
        RENAME COLUMN texto_entrada TO texto_entrada_encrypted
      `);
      console.log("Columna texto_entrada renombrada a texto_entrada_encrypted");
    } else {
      console.log("Columna texto_entrada no existe, omitiendo...");
    }

    console.log("Migración revertida");
  }
}
