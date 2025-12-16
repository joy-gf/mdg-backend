import { AppDataSource } from "../config/datasource";
import { HistorialSesion } from "../entities/HistorialSesion.entity";
import { HistorialTratamiento } from "../entities/HistorialTratamiento.entity";

const repo = AppDataSource.getRepository(HistorialSesion);

export class HistorialSesionService {
  static getByTratamiento(tratamientoId: string) {
    return repo.find({
      where: {
        tratamiento: { id: tratamientoId },
      },
      order: { fecha_sesion: "ASC" },
    });
  }

  static async create(
    tratamientoId: string,
    data: Partial<HistorialSesion>
  ) {
    const tratamientoRepo =
      AppDataSource.getRepository(HistorialTratamiento);

    const tratamiento = await tratamientoRepo.findOneBy({
      id: tratamientoId,
    });

    if (!tratamiento) {
      throw new Error("Tratamiento no encontrado");
    }

    const sesion = repo.create({
      ...data,
      tratamiento,
    });

    return repo.save(sesion);
  }
}
