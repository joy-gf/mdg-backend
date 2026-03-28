import { TableColumn } from "typeorm";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinalizacionToHistorialSesion1760059260000
 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "historial_sesion",
      new TableColumn({
        name: "finalizada",
        type: "boolean",
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      "historial_sesion",
      new TableColumn({
        name: "fecha_finalizacion",
        type: "timestamp",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("historial_sesion", "fecha_finalizacion");
    await queryRunner.dropColumn("historial_sesion", "finalizada");
  }
}
