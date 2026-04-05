import { TableColumn } from "typeorm";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppointmentRequestFields1738402800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add solicitada_por column
    await queryRunner.addColumn(
      "citas",
      new TableColumn({
        name: "solicitada_por",
        type: "varchar",
        length: "20",
        isNullable: true,
      })
    );

    // Add fecha_confirmacion column
    await queryRunner.addColumn(
      "citas",
      new TableColumn({
        name: "fecha_confirmacion",
        type: "timestamp",
        isNullable: true,
      })
    );

    // Add motivo_rechazo column
    await queryRunner.addColumn(
      "citas",
      new TableColumn({
        name: "motivo_rechazo",
        type: "text",
        isNullable: true,
      })
    );

    // Update estado column to include new states
    await queryRunner.changeColumn(
      "citas",
      "estado",
      new TableColumn({
        name: "estado",
        type: "varchar",
        length: "20",
        default: "'activa'",
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove added columns
    await queryRunner.dropColumn("citas", "motivo_rechazo");
    await queryRunner.dropColumn("citas", "fecha_confirmacion");
    await queryRunner.dropColumn("citas", "solicitada_por");

    // Revert estado column (though values remain the same)
    await queryRunner.changeColumn(
      "citas",
      "estado",
      new TableColumn({
        name: "estado",
        type: "varchar",
        length: "20",
        default: "'activa'",
        isNullable: false,
      })
    );
  }
}
