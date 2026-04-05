import type { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePsicologoConstraints1705000000002 implements MigrationInterface {
  name = "UpdatePsicologoConstraints1705000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Hacer CI único y NOT NULL en psicólogos
    console.log("Actualizando columna CI en tabla psicologos...");

    // Primero, asignar valores temporales a CIs vacíos
    await queryRunner.query(`
      UPDATE psicologos
      SET ci = CONCAT('TEMP-', id::text)
      WHERE ci IS NULL OR ci = ''
    `);

    // Hacer columna NOT NULL
    await queryRunner.query(`
      ALTER TABLE psicologos
      ALTER COLUMN ci SET NOT NULL
    `);

    // Agregar constraint UNIQUE
    await queryRunner.query(`
      ALTER TABLE psicologos
      ADD CONSTRAINT uq_psicologos_ci UNIQUE (ci)
    `);

    // 2. Hacer matricula_profesional NOT NULL
    console.log("Actualizando columna matricula_profesional...");

    // Asignar valores temporales a matrículas vacías
    await queryRunner.query(`
      UPDATE psicologos
      SET matricula_profesional = CONCAT('TEMP-MAT-', id::text)
      WHERE matricula_profesional IS NULL OR matricula_profesional = ''
    `);

    // Hacer columna NOT NULL
    await queryRunner.query(`
      ALTER TABLE psicologos
      ALTER COLUMN matricula_profesional SET NOT NULL
    `);

    // Opcional: Agregar constraint UNIQUE a matricula_profesional
    await queryRunner.query(`
      ALTER TABLE psicologos
      ADD CONSTRAINT uq_psicologos_matricula UNIQUE (matricula_profesional)
    `);

    console.log("Constraints actualizados en tabla psicologos");
    console.log("IMPORTANTE: Actualizar los CIs y matrículas temporales con valores reales");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir constraint UNIQUE de matricula_profesional
    await queryRunner.query(`
      ALTER TABLE psicologos DROP CONSTRAINT IF EXISTS uq_psicologos_matricula
    `);

    // Hacer matricula_profesional nullable
    await queryRunner.query(`
      ALTER TABLE psicologos ALTER COLUMN matricula_profesional DROP NOT NULL
    `);

    // Revertir constraint UNIQUE de CI
    await queryRunner.query(`
      ALTER TABLE psicologos DROP CONSTRAINT IF EXISTS uq_psicologos_ci
    `);

    // Hacer CI nullable
    await queryRunner.query(`
      ALTER TABLE psicologos ALTER COLUMN ci DROP NOT NULL
    `);

    console.log("Constraints revertidos en tabla psicologos");
  }
}
