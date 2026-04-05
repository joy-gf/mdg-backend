import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToRegistroTareas1738545000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, merge any existing duplicates by keeping the oldest record
    // and summing the veces_completado and tiempo_total_segundos
    await queryRunner.query(`
      WITH duplicates AS (
        SELECT
          paciente_id,
          tipo_tarea,
          DATE(fecha) as fecha_date,
          COUNT(*) as count
        FROM registro_tareas_terapeuticas
        GROUP BY paciente_id, tipo_tarea, DATE(fecha)
        HAVING COUNT(*) > 1
      ),
      ranked AS (
        SELECT
          rt.id,
          rt.paciente_id,
          rt.tipo_tarea,
          DATE(rt.fecha) as fecha_date,
          rt.veces_completado,
          rt.tiempo_total_segundos,
          ROW_NUMBER() OVER (
            PARTITION BY rt.paciente_id, rt.tipo_tarea, DATE(rt.fecha)
            ORDER BY rt.created_at ASC
          ) as rn
        FROM registro_tareas_terapeuticas rt
        INNER JOIN duplicates d
          ON rt.paciente_id = d.paciente_id
          AND rt.tipo_tarea = d.tipo_tarea
          AND DATE(rt.fecha) = d.fecha_date
      )
      UPDATE registro_tareas_terapeuticas rt
      SET
        veces_completado = rt.veces_completado + COALESCE(dup_sum.total_veces, 0),
        tiempo_total_segundos = rt.tiempo_total_segundos + COALESCE(dup_sum.total_tiempo, 0)
      FROM (
        SELECT
          r1.id as primary_id,
          SUM(CASE WHEN r2.rn > 1 THEN r2.veces_completado ELSE 0 END) as total_veces,
          SUM(CASE WHEN r2.rn > 1 THEN r2.tiempo_total_segundos ELSE 0 END) as total_tiempo
        FROM ranked r1
        LEFT JOIN ranked r2
          ON r1.paciente_id = r2.paciente_id
          AND r1.tipo_tarea = r2.tipo_tarea
          AND r1.fecha_date = r2.fecha_date
        WHERE r1.rn = 1
        GROUP BY r1.id
      ) dup_sum
      WHERE rt.id = dup_sum.primary_id;
    `);

    // Delete duplicate records (keep only the oldest one per group)
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY paciente_id, tipo_tarea, DATE(fecha)
            ORDER BY created_at ASC
          ) as rn
        FROM registro_tareas_terapeuticas
      )
      DELETE FROM registro_tareas_terapeuticas
      WHERE id IN (
        SELECT id FROM ranked WHERE rn > 1
      );
    `);

    // Add unique constraint
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_registro_tareas_unique
      ON registro_tareas_terapeuticas (paciente_id, tipo_tarea, DATE(fecha));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_registro_tareas_unique;
    `);
  }
}
