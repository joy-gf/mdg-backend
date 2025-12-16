import { AppDataSource } from "../config/datasource";
import { HistorialTratamiento } from "../entities/HistorialTratamiento.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Psicologo } from "../entities/Psicologo.entity";

const repo = AppDataSource.getRepository(HistorialTratamiento);

export class HistorialTratamientoService {
  static getByPaciente(pacienteId: string) {
    return repo.find({
      where: {
        paciente: { id: pacienteId },
      },
      relations: ["psicologo"],
      order: { fecha_inicio: "DESC" },
    });
  }

  /** Obtener un tratamiento con sesiones */
  static getById(id: string) {
    return repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo", "sesiones"],
    });
  }

  static async create(
    pacienteId: string,
    psicologoId: string | null,
    data: Partial<HistorialTratamiento>
  ) {
    const pacienteRepo = AppDataSource.getRepository(Paciente);
    const psicologoRepo = AppDataSource.getRepository(Psicologo);

    const paciente = await pacienteRepo.findOneBy({ id: pacienteId });
    if (!paciente) throw new Error("Paciente no encontrado");

    const psicologo = psicologoId
      ? await psicologoRepo.findOneBy({ id: psicologoId })
      : null;

    const tratamiento = repo.create({
      ...data,
      paciente,
      psicologo,
    });

    return repo.save(tratamiento);
  }

  static async cerrar(id: string, comentarios_finales?: string) {
    const tratamiento = await repo.findOneBy({ id });
    if (!tratamiento) throw new Error("Tratamiento no encontrado");

    tratamiento.activo = false;
    tratamiento.fecha_cierre = new Date();
    tratamiento.comentarios_finales = comentarios_finales ?? null;

    return repo.save(tratamiento);
  }
}
