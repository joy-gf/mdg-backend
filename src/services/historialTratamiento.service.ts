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
      relations: ["paciente", "psicologo"],
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

    const saved = await repo.save(tratamiento);
    return repo.findOne({
      where: { id: saved.id },
      relations: ["paciente", "psicologo"],
    });
  }

  static async update(id: string, data: Partial<HistorialTratamiento>) {
    const tratamiento = await repo.findOneBy({ id });
    if (!tratamiento) throw new Error("Tratamiento no encontrado");

    Object.assign(tratamiento, data);
    await repo.save(tratamiento);
    return repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo"],
    });
  }

  static async cerrar(id: string, comentarios_finales_encrypted?: string) {
    const tratamiento = await repo.findOneBy({ id });
    if (!tratamiento) throw new Error("Tratamiento no encontrado");

    tratamiento.activo = false;
    tratamiento.fecha_cierre = new Date().toISOString().split('T')[0] as any;
    tratamiento.comentarios_finales_encrypted = comentarios_finales_encrypted ?? null;

    await repo.save(tratamiento);
    return repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo"],
    });
  }
}
