import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Fix camelCase Column Names
 *
 * When tables were created using unquoted camelCase identifiers (e.g. pacienteId),
 * PostgreSQL silently lowercases them (pacienteid). This migration renames those
 * columns to their proper quoted camelCase form so they match the application code.
 *
 * Affected tables and columns:
 *   historial_tratamiento : pacienteid  → "pacienteId"
 *                           psicologoid → "psicologoId"
 *   historial_sesion      : tratamientoid → "tratamientoId"
 *   citas                 : pacienteid   → "pacienteId"
 *                           psicologoid  → "psicologoId"
 *                           consultorioid → "consultorioId"
 *
 * Each rename is guarded: it only runs when the lowercase column actually exists,
 * so the migration is safe to run on databases that were already created correctly.
 */
export class FixCamelCaseColumnNames1743800000000 implements MigrationInterface {
  name = "FixCamelCaseColumnNames1743800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN

        -- historial_tratamiento.pacienteid → "pacienteId"
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'historial_tratamiento' AND column_name = 'pacienteid'
        ) THEN
          ALTER TABLE historial_tratamiento RENAME COLUMN pacienteid TO "pacienteId";
        END IF;

        -- historial_tratamiento.psicologoid → "psicologoId"
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'historial_tratamiento' AND column_name = 'psicologoid'
        ) THEN
          ALTER TABLE historial_tratamiento RENAME COLUMN psicologoid TO "psicologoId";
        END IF;

        -- historial_sesion.tratamientoid → "tratamientoId"
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'historial_sesion' AND column_name = 'tratamientoid'
        ) THEN
          ALTER TABLE historial_sesion RENAME COLUMN tratamientoid TO "tratamientoId";
        END IF;

        -- citas.pacienteid → "pacienteId"
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'citas' AND column_name = 'pacienteid'
        ) THEN
          ALTER TABLE citas RENAME COLUMN pacienteid TO "pacienteId";
        END IF;

        -- citas.psicologoid → "psicologoId"
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'citas' AND column_name = 'psicologoid'
        ) THEN
          ALTER TABLE citas RENAME COLUMN psicologoid TO "psicologoId";
        END IF;

        -- citas.consultorioid → "consultorioId"
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'citas' AND column_name = 'consultorioid'
        ) THEN
          ALTER TABLE citas RENAME COLUMN consultorioid TO "consultorioId";
        END IF;

      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'historial_tratamiento' AND column_name = 'pacienteid'
        ) THEN
          ALTER TABLE historial_tratamiento RENAME COLUMN "pacienteId" TO pacienteid;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'historial_tratamiento' AND column_name = 'psicologoid'
        ) THEN
          ALTER TABLE historial_tratamiento RENAME COLUMN "psicologoId" TO psicologoid;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'historial_sesion' AND column_name = 'tratamientoid'
        ) THEN
          ALTER TABLE historial_sesion RENAME COLUMN "tratamientoId" TO tratamientoid;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'citas' AND column_name = 'pacienteid'
        ) THEN
          ALTER TABLE citas RENAME COLUMN "pacienteId" TO pacienteid;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'citas' AND column_name = 'psicologoid'
        ) THEN
          ALTER TABLE citas RENAME COLUMN "psicologoId" TO psicologoid;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'citas' AND column_name = 'consultorioid'
        ) THEN
          ALTER TABLE citas RENAME COLUMN "consultorioId" TO consultorioid;
        END IF;

      END $$;
    `);
  }
}
