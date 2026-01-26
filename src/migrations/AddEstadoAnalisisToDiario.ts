import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add estado_analisis to DiarioEmocional
 *
 * Agrega campo para rastrear si la entrada fue analizada
 */
export class AddEstadoAnalisisToDiario1737900001000 implements MigrationInterface {
  name = "AddEstadoAnalisisToDiario1737900001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("📝 Agregando campo estado_analisis a diario_emocional...");

    await queryRunner.query(`
      ALTER TABLE diario_emocional
      ADD COLUMN estado_analisis VARCHAR(20) DEFAULT 'pendiente'
      CHECK (estado_analisis IN ('pendiente', 'analizado', 'error'))
    `);

    console.log("Campo agregado exitosamente");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("Eliminando campo estado_analisis...");

    await queryRunner.query(`
      ALTER TABLE diario_emocional
      DROP COLUMN IF EXISTS estado_analisis
    `);

    console.log("Campo eliminado");
  }
}
