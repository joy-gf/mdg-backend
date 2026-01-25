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
      relations: ["tratamiento"],
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

    const saved = await repo.save(sesion);
    return repo.findOne({
      where: { id: saved.id },
      relations: ["tratamiento"],
    });
  }

  static async update(
    sesionId: string,
    tratamientoId: string,
    data: Partial<HistorialSesion>
  ) {
    const sesion = await repo.findOne({
      where: {
        id: sesionId,
        tratamiento: { id: tratamientoId },
      },
    });

    if (!sesion) {
      throw new Error("Sesión no encontrada");
    }

    Object.assign(sesion, data);
    await repo.save(sesion);
    return repo.findOne({
      where: { id: sesionId },
      relations: ["tratamiento"],
    });
  }
}
