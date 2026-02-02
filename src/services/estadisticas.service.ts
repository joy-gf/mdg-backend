import { AppDataSource } from "../config/datasource";
import { Psicologo } from "../entities/Psicologo.entity";
import { PsicologoEstadistica } from "../types/estadisticas.types";

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
}
