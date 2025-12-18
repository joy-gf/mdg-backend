import { AppDataSource } from "../config/datasource";
import { Cita } from "../entities/Cita.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Psicologo } from "../entities/Psicologo.entity";
import { Consultorio } from "../entities/Consultorio.entity";

export class CitasService {
  private static repo = AppDataSource.getRepository(Cita);

  static async getAll() {
    return this.repo.find({
      relations: ["paciente", "psicologo", "consultorio"],
      order: { fecha_sesion: "ASC" },
    });
  }

  static async getByPaciente(pacienteId: string) {
    return this.repo.find({
      where: { paciente: { id: pacienteId } },
      relations: ["psicologo", "consultorio"],
    });
  }

  static async getByPsicologo(psicologoId: string) {
    return this.repo.find({
      where: { psicologo: { id: psicologoId } },
      relations: ["paciente", "consultorio"],
    });
  }

  static async create(data: {
    pacienteId: string;
    psicologoId: string;
    consultorioId?: string;
    fecha_sesion: Date;
    hora_sesion: Date;
    duracion_minutos: number;
    tipo_cita: string;
    direccion_cita?: string;
    link_cita?: string;
  }) {

    const inicio = new Date(`${data.fecha_sesion}T${data.hora_sesion}:00`);
    console.log(inicio)
    const fin = new Date(
      inicio.getTime() + data.duracion_minutos * 60000
    );

    await this.validarDisponibilidad(
      data.consultorioId!,
      data.psicologoId,
      inicio,
      fin
    );

    const cita = this.repo.create({
      paciente: { id: data.pacienteId } as Paciente,
      psicologo: { id: data.psicologoId } as Psicologo,
      consultorio: data.consultorioId
        ? ({ id: data.consultorioId } as Consultorio)
        : null,
      fecha_sesion: inicio,
      hora_sesion: inicio,
      duracion_minutos: data.duracion_minutos,
      tipo_cita: data.tipo_cita,
      direccion_cita: data.direccion_cita,
      link_cita: data.link_cita,
    });

    console.log(cita)
    return this.repo.save(cita);
  }

  static async cancelar(id: string) {
    await this.repo.update(id, { estado: "cancelada" });
  }

  static async reprogramar(
    id: string,
    fecha_sesion: Date,
    hora_sesion: Date
  ) {
    await this.repo.update(id, {
      fecha_sesion,
      hora_sesion,
      estado: "reprogramada",
    });
  }

  static async validarDisponibilidad(
    consultorioId: string,
    psicologoId: string,
    inicio: Date,
    fin: Date
  ) {
    const qb = this.repo.createQueryBuilder("c");

    const conflicto = await qb
        .where("c.estado = 'activa'")
        .andWhere(
        "(c.fecha_sesion < :fin AND c.hora_sesion + (c.duracion_minutos || ' minutes')::interval > :inicio)",
        { inicio, fin }
        )
        .andWhere(
        "(c.consultorioId = :consultorioId OR c.psicologoId = :psicologoId)",
        { consultorioId, psicologoId }
        )
        .getOne();

    if (conflicto) {
        throw new Error("Conflicto de disponibilidad");
    }
  }
}
