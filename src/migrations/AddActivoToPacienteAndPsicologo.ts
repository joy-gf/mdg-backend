import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddActivoToPacienteAndPsicologo1737670000000 implements MigrationInterface {
  name = "AddActivoToPacienteAndPsicologo1737670000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const pacientesTable = await queryRunner.getTable("pacientes");
    const pacientesActivoColumn = pacientesTable?.findColumnByName("activo");

    if (!pacientesActivoColumn) {
      await queryRunner.addColumn(
        "pacientes",
        new TableColumn({
          name: "activo",
          type: "boolean",
          default: true,
          isNullable: false,
        })
      );

      console.log("Columna 'activo' agregada a tabla pacientes");
    } else {
      console.log("Columna 'activo' ya existe en tabla pacientes");
    }

    const psicologosTable = await queryRunner.getTable("psicologos");
    const psicologosActivoColumn = psicologosTable?.findColumnByName("activo");

    if (!psicologosActivoColumn) {
      await queryRunner.addColumn(
        "psicologos",
        new TableColumn({
          name: "activo",
          type: "boolean",
          default: true,
          isNullable: false,
        })
      );

      console.log("Columna 'activo' agregada a tabla psicologos");
    } else {
      console.log("Columna 'activo' ya existe en tabla psicologos");
    }

    await queryRunner.query(`
      UPDATE pacientes
      SET activo = true
      WHERE activo IS NULL
    `);

    await queryRunner.query(`
      UPDATE psicologos
      SET activo = true
      WHERE activo IS NULL
    `);

    console.log("Registros existentes marcados como activos");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const psicologosTable = await queryRunner.getTable("psicologos");
    const psicologosActivoColumn = psicologosTable?.findColumnByName("activo");

    if (psicologosActivoColumn) {
      await queryRunner.dropColumn("psicologos", "activo");
      console.log("Columna 'activo' eliminada de tabla psicologos");
    }

    const pacientesTable = await queryRunner.getTable("pacientes");
    const pacientesActivoColumn = pacientesTable?.findColumnByName("activo");

    if (pacientesActivoColumn) {
      await queryRunner.dropColumn("pacientes", "activo");
      console.log("Columna 'activo' eliminada de tabla pacientes");
    }
  }
}
