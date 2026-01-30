import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddNotaValidacionToAnalisis1738188000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "analisis_sentimiento",
      new TableColumn({
        name: "nota_validacion_psicologo",
        type: "text",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("analisis_sentimiento", "nota_validacion_psicologo");
  }
}
