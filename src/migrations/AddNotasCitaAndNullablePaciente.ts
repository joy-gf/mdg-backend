import { TableColumn } from "typeorm";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotasCitaAndNullablePaciente1738187000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add notas_cita column
    await queryRunner.addColumn(
      "citas",
      new TableColumn({
        name: "notas_cita",
        type: "text",
        isNullable: true,
      })
    );

    // Make pacienteId nullable
    await queryRunner.changeColumn(
      "citas",
      "pacienteId",
      new TableColumn({
        name: "pacienteId",
        type: "uuid",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove notas_cita column
    await queryRunner.dropColumn("citas", "notas_cita");

    // Make pacienteId non-nullable again
    await queryRunner.changeColumn(
      "citas",
      "pacienteId",
      new TableColumn({
        name: "pacienteId",
        type: "uuid",
        isNullable: false,
      })
    );
  }
}
