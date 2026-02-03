import { AppDataSource } from "../config/datasource";
import { Psicologo } from "../entities/Psicologo.entity";
import { ResumenPacientePsicologo } from "../types/psicologoResumen.types";

export class PsicologoResumenService {
  private static psicologoRepo = AppDataSource.getRepository(Psicologo);

  /**
   * Obtener resumen de pacientes de un psicólogo
   * Incluye: nombre, fecha última cita, sesiones totales vs finalizadas
   */
  static async getResumenPacientes(
    psicologoId: string
  ): Promise<ResumenPacientePsicologo[]> {
    try {
      console.log("=== getResumenPacientes ===");
      console.log("psicologoId recibido:", psicologoId);
      console.log("tipo:", typeof psicologoId);

      const query = `
        SELECT
          p.id AS paciente_id,
          p.nombres AS paciente_nombre,
          p.apellidos AS paciente_apellido,
          MAX(c.fecha_sesion) FILTER (WHERE c.fecha_sesion <= CURRENT_DATE) AS fecha_ultima_cita,
          COUNT(DISTINCT hs.id) AS total_sesiones,
          COUNT(DISTINCT hs.id) FILTER (WHERE hs.finalizada = true) AS sesiones_finalizadas,
          COALESCE(BOOL_OR(ht.activo), false) AS tratamiento_activo
        FROM pacientes p
        LEFT JOIN historial_tratamiento ht ON ht."pacienteId" = p.id
        LEFT JOIN historial_sesion hs ON hs."tratamientoId" = ht.id
        LEFT JOIN citas c ON c."pacienteId" = p.id
          AND c."psicologoId" = $1
          AND c.estado != 'cancelada'
        WHERE p.psicologo_id = $1
        GROUP BY p.id, p.nombres, p.apellidos
        ORDER BY
          tratamiento_activo DESC,
          fecha_ultima_cita DESC NULLS LAST,
          p.apellidos ASC,
          p.nombres ASC
      `;

      console.log("Ejecutando query con psicologoId:", psicologoId);
      const result = await AppDataSource.query(query, [psicologoId]);
      console.log("Resultados encontrados:", result.length);

      return result.map((row: any) => ({
        paciente_id: row.paciente_id,
        paciente_nombre: row.paciente_nombre,
        paciente_apellido: row.paciente_apellido,
        fecha_ultima_cita: row.fecha_ultima_cita || null,
        total_sesiones: parseInt(row.total_sesiones) || 0,
        sesiones_finalizadas: parseInt(row.sesiones_finalizadas) || 0,
        tratamiento_activo: row.tratamiento_activo || false,
      }));
    } catch (error) {
      console.error("Error al obtener resumen de pacientes:", error);
      throw new Error("Error al obtener resumen de pacientes");
    }
  }
}
