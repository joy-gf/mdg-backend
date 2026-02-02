import { AppDataSource } from "../data-source";
import { Psicologo } from "../entities/Psicologo";
import { PsicologoEstadistica } from "../types/estadisticas.types";

export class EstadisticasService {
  private psicologoRepository = AppDataSource.getRepository(Psicologo);

  async getEstadisticasPsicologos(
    periodoDias: number
  ): Promise<PsicologoEstadistica[]> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - periodoDias);

      const estadisticas = await this.psicologoRepository
        .createQueryBuilder("psicologo")
        .select("psicologo.id", "id")
        .addSelect("psicologo.nombres", "nombres")
        .addSelect("psicologo.apellidos", "apellidos")
        .addSelect(
          `COUNT(DISTINCT CASE WHEN tratamiento.activo = true THEN tratamiento.paciente_id END)`,
          "pacientes_activos"
        )
        .addSelect(
          `COUNT(DISTINCT CASE WHEN sesion.fecha_sesion >= :fechaLimite THEN sesion.id END)`,
          "total_sesiones"
        )
        .leftJoin("psicologo.tratamientos", "tratamiento")
        .leftJoin("tratamiento.sesiones", "sesion")
        .where("psicologo.activo = :activo", { activo: true })
        .setParameter("fechaLimite", fechaLimite)
        .groupBy("psicologo.id")
        .addGroupBy("psicologo.nombres")
        .addGroupBy("psicologo.apellidos")
        .orderBy("psicologo.apellidos", "ASC")
        .addOrderBy("psicologo.nombres", "ASC")
        .getRawMany();

      return estadisticas.map((est) => ({
        id: est.id,
        nombres: est.nombres,
        apellidos: est.apellidos,
        pacientes_activos: parseInt(est.pacientes_activos) || 0,
        total_sesiones: parseInt(est.total_sesiones) || 0,
      }));
    } catch (error) {
      console.error("Error al obtener estadísticas de psicólogos:", error);
      throw new Error("Error al obtener estadísticas de psicólogos");
    }
  }
}
