import { AppDataSource } from "../config/datasource";
import { NotaRapida } from "../entities/NotaRapida.entity";

export class NotasRapidasService {
  private static repo = AppDataSource.getRepository(NotaRapida);

  static async getByPaciente(pacienteId: string): Promise<NotaRapida[]> {
    return this.repo.find({
      where: { paciente_id: pacienteId },
      order: { created_at: "DESC" },
    });
  }

  static async create(data: {
    pacienteId: string;
    psicologoId: string;
    contenido: string;
  }): Promise<NotaRapida> {
    if (!data.contenido?.trim()) {
      const err: any = new Error("El contenido de la nota no puede estar vacío");
      err.status = 400;
      throw err;
    }
    const nota = this.repo.create({
      paciente_id: data.pacienteId,
      psicologo_id: data.psicologoId,
      contenido: data.contenido.trim(),
    });
    return this.repo.save(nota);
  }

  static async update(id: string, contenido: string): Promise<NotaRapida> {
    if (!contenido?.trim()) {
      const err: any = new Error("El contenido no puede estar vacío");
      err.status = 400;
      throw err;
    }
    const nota = await this.repo.findOne({ where: { id } });
    if (!nota) {
      const err: any = new Error("Nota no encontrada");
      err.status = 404;
      throw err;
    }
    nota.contenido = contenido.trim();
    return this.repo.save(nota);
  }

  static async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
