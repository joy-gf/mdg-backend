import { TableColumn, TableForeignKey } from "typeorm";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPsicologoIdToPacientes1769360000000 implements MigrationInterface {
  name = "AddPsicologoIdToPacientes1769360000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const pacientesTable = await queryRunner.getTable("pacientes");
    const psicologoIdColumn = pacientesTable?.findColumnByName("psicologo_id");

    if (!psicologoIdColumn) {
      await queryRunner.addColumn(
        "pacientes",
        new TableColumn({
          name: "psicologo_id",
          type: "uuid",
          isNullable: true,
        })
      );

      await queryRunner.createForeignKey(
        "pacientes",
        new TableForeignKey({
          columnNames: ["psicologo_id"],
          referencedColumnNames: ["id"],
          referencedTableName: "psicologos",
          onDelete: "SET NULL",
        })
      );

      console.log("Columna psicologo_id agregada a pacientes");
    } else {
      console.log("Columna psicologo_id ya existe en pacientes");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const pacientesTable = await queryRunner.getTable("pacientes");
    const foreignKey = pacientesTable?.foreignKeys.find(
      fk => fk.columnNames.indexOf("psicologo_id") !== -1
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey("pacientes", foreignKey);
    }

    const psicologoIdColumn = pacientesTable?.findColumnByName("psicologo_id");
    if (psicologoIdColumn) {
      await queryRunner.dropColumn("pacientes", "psicologo_id");
      console.log("Columna psicologo_id eliminada de pacientes");
    }
  }
}
