import { TableColumn } from "typeorm";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCIToPacientes1705000000001 implements MigrationInterface {
  name = "AddCIToPacientes1705000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna CI a la tabla pacientes
    await queryRunner.addColumn(
      "pacientes",
      new TableColumn({
        name: "ci",
        type: "varchar",
        length: "20",
        isUnique: true,
        isNullable: true, // Temporalmente nullable para datos existentes
      })
    );

    // Opcionalmente: Asignar CIs temporales a pacientes existentes
    // Puedes comentar esta línea si prefieres asignar CIs manualmente
    await queryRunner.query(`
      UPDATE pacientes
      SET ci = CONCAT('TEMP-', id::text)
      WHERE ci IS NULL
    `);

    // Hacer el campo NOT NULL después de asignar valores
    await queryRunner.query(`
      ALTER TABLE pacientes
      ALTER COLUMN ci SET NOT NULL
    `);

    // Crear índice único para mejorar rendimiento de búsquedas
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_ci ON pacientes(ci)
    `);

    console.log("Columna CI agregada a tabla pacientes con constraint UNIQUE");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_pacientes_ci
    `);

    // Eliminar columna CI
    await queryRunner.dropColumn("pacientes", "ci");

    console.log("Columna CI eliminada de tabla pacientes");
  }
}
