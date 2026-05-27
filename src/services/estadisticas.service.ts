import { AppDataSource } from "../config/datasource";
import { Psicologo } from "../entities/Psicologo.entity";
import { PsicologoEstadistica } from "../types/estadisticas.types";

export interface ResumenAdmin {
  pacientes_activos: number;
  citas_esta_semana: number;
  tasa_asistencia: number;
  psicologo_mas_carga: { nombre: string; pacientes_activos: number } | null;
}

export class EstadisticasService {
  private psicologoRepository = AppDataSource.getRepository(Psicologo);

  async getEstadisticasPsicologos(
    periodoDias: number
  ): Promise<PsicologoEstadistica[]> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - periodoDias);
      const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

      const query = `
        SELECT
          p.id,
          p.nombres,
          p.apellidos,
          COUNT(DISTINCT CASE WHEN t.activo = true THEN t."pacienteId" END)::integer AS pacientes_activos,
          COUNT(DISTINCT CASE WHEN s.fecha_sesion >= $1 THEN s.id END)::integer AS total_sesiones
        FROM psicologos p
        LEFT JOIN historial_tratamiento t ON t."psicologoId" = p.id
        LEFT JOIN historial_sesion s ON s."tratamientoId" = t.id
        WHERE p.activo = true
        GROUP BY p.id, p.nombres, p.apellidos
        ORDER BY p.apellidos ASC, p.nombres ASC
      `;

      const estadisticas = await AppDataSource.query(query, [fechaLimiteStr]);

      return estadisticas.map((est: any) => ({
        id: est.id,
        nombres: est.nombres,
        apellidos: est.apellidos,
        pacientes_activos: est.pacientes_activos || 0,
        total_sesiones: est.total_sesiones || 0,
      }));
    } catch (error) {
      console.error("Error al obtener estadísticas de psicólogos:", error);
      throw new Error("Error al obtener estadísticas de psicólogos");
    }
  }

  async getResumenAdmin(): Promise<ResumenAdmin> {
    const [
      pacientesResult,
      citasResult,
      asistenciaResult,
      cargaResult,
    ] = await Promise.all([
      AppDataSource.query(
        `SELECT COUNT(*)::integer AS total FROM pacientes WHERE activo = true`
      ),
      AppDataSource.query(
        `SELECT COUNT(*)::integer AS total FROM citas
         WHERE fecha_sesion >= date_trunc('week', NOW() AT TIME ZONE 'America/La_Paz')
           AND fecha_sesion < date_trunc('week', NOW() AT TIME ZONE 'America/La_Paz') + INTERVAL '7 days'
           AND estado NOT IN ('cancelada', 'rechazada')`
      ),
      AppDataSource.query(
        `SELECT
           COUNT(CASE WHEN estado = 'finalizada' THEN 1 END)::integer AS finalizadas,
           COUNT(CASE WHEN estado NOT IN ('cancelada', 'rechazada') THEN 1 END)::integer AS total
         FROM citas
         WHERE fecha_sesion >= NOW() - INTERVAL '30 days'`
      ),
      AppDataSource.query(
        `SELECT p.nombres || ' ' || p.apellidos AS nombre,
                COUNT(pac.id)::integer AS pacientes_activos
         FROM psicologos p
         JOIN pacientes pac ON pac.psicologo_id = p.id AND pac.activo = true
         WHERE p.activo = true
         GROUP BY p.id, p.nombres, p.apellidos
         ORDER BY pacientes_activos DESC
         LIMIT 1`
      ),
    ]);

    const finalizadas = asistenciaResult[0]?.finalizadas ?? 0;
    const totalCitas  = asistenciaResult[0]?.total ?? 0;
    const tasa = totalCitas > 0 ? Math.round((finalizadas / totalCitas) * 100) : 0;

    return {
      pacientes_activos:   pacientesResult[0]?.total ?? 0,
      citas_esta_semana:   citasResult[0]?.total ?? 0,
      tasa_asistencia:     tasa,
      psicologo_mas_carga: cargaResult[0] ?? null,
    };
  }
}
