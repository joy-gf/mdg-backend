import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Refactor Citas Fecha y Hora Types
 *
 * Cambia los tipos de columna de fecha_sesion y hora_sesion de TIMESTAMP a DATE y TIME
 * para eliminar conversiones innecesarias y mejorar el manejo de fechas.
 */
export class RefactorCitasFechaHoraTypes1738000000000 implements MigrationInterface {
  name = "RefactorCitasFechaHoraTypes1738000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {

    // Cambiar fecha_sesion de TIMESTAMP a DATE
    await queryRunner.query(`
      ALTER TABLE citas
      ALTER COLUMN fecha_sesion TYPE DATE USING fecha_sesion::DATE
    `);

    // Cambiar hora_sesion de TIMESTAMP a TIME
    await queryRunner.query(`
      ALTER TABLE citas
      ALTER COLUMN hora_sesion TYPE TIME USING hora_sesion::TIME
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("⏪ Revirtiendo cambios en tabla citas...");

    // Revertir hora_sesion de TIME a TIMESTAMP
    await queryRunner.query(`
      ALTER TABLE citas
      ALTER COLUMN hora_sesion TYPE TIMESTAMP USING
        (CURRENT_DATE + hora_sesion)
    `);

    await queryRunner.query(`
      ALTER TABLE citas
      ALTER COLUMN fecha_sesion TYPE TIMESTAMP USING
        fecha_sesion::TIMESTAMP
    `);
  }
}
