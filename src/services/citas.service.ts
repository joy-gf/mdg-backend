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
    fecha_sesion: string;
    hora_sesion: string;
    duracion_minutos: number;
    tipo_cita: string;
    direccion_cita?: string;
    link_cita?: string;
  }) {

    const fechaHoraISO = `${data.fecha_sesion}T${data.hora_sesion}:00`;
    const inicio = new Date(fechaHoraISO);
    const fin = new Date(inicio.getTime() + data.duracion_minutos * 60000);

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
      fecha_sesion: data.fecha_sesion, // YYYY-MM-DD
      hora_sesion: data.hora_sesion,   // HH:mm
      duracion_minutos: data.duracion_minutos,
      tipo_cita: data.tipo_cita,
      direccion_cita: data.direccion_cita,
      link_cita: data.link_cita,
    });

    return this.repo.save(cita);
  }

  static async update(
    id: string,
    data: {
      fecha_sesion?: string;
      hora_sesion?: string;
      duracion_minutos?: number;
      tipo_cita?: string;
      consultorioId?: string | null;
      direccion_cita?: string | null;
      link_cita?: string | null;
    }
  ) {
    const cita = await this.repo.findOne({
      where: { id },
      relations: ["psicologo", "consultorio"],
    });

    if (!cita) {
      throw new Error("Cita no encontrada");
    }

    if (data.fecha_sesion || data.hora_sesion || data.consultorioId !== undefined) {
      const fechaHoraISO = `${data.fecha_sesion || cita.fecha_sesion}T${data.hora_sesion || cita.hora_sesion}:00`;
      const inicio = new Date(fechaHoraISO);
      const duracion = data.duracion_minutos || cita.duracion_minutos;
      const fin = new Date(inicio.getTime() + duracion * 60000);

      const consultorioId = data.consultorioId !== undefined
        ? data.consultorioId
        : cita.consultorio?.id || "";

      if (consultorioId) {
        await this.validarDisponibilidad(
          consultorioId,
          cita.psicologo.id,
          inicio,
          fin
        );
      }
    }

    const updateData: any = {
      estado: "reprogramada",
    };

    if (data.fecha_sesion !== undefined) updateData.fecha_sesion = data.fecha_sesion;
    if (data.hora_sesion !== undefined) updateData.hora_sesion = data.hora_sesion;
    if (data.duracion_minutos !== undefined) updateData.duracion_minutos = data.duracion_minutos;
    if (data.tipo_cita !== undefined) updateData.tipo_cita = data.tipo_cita;
    if (data.consultorioId !== undefined) {
      updateData.consultorio = data.consultorioId ? ({ id: data.consultorioId } as Consultorio) : null;
    }
    if (data.direccion_cita !== undefined) updateData.direccion_cita = data.direccion_cita;
    if (data.link_cita !== undefined) updateData.link_cita = data.link_cita;

    await this.repo.update(id, updateData);
    return this.repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo", "consultorio"],
    });
  }

  static async cancelar(id: string) {
    await this.repo.update(id, { estado: "cancelada" });
  }

  static async validarDisponibilidad(
    consultorioId: string,
    psicologoId: string,
    inicio: Date,
    fin: Date
  ) {
    const fechaInicio = inicio.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaInicio = inicio.toTimeString().slice(0, 8); // HH:mm:ss
    const horaFin = fin.toTimeString().slice(0, 8); // HH:mm:ss

    const qb = this.repo.createQueryBuilder("c");

    const conflicto = await qb
        .where("c.estado = 'activa'")
        .andWhere("c.fecha_sesion = :fecha", { fecha: fechaInicio })
        .andWhere(
          "(c.hora_sesion < :horaFin AND (c.hora_sesion + (c.duracion_minutos || ' minutes')::interval) > :horaInicio)",
          { horaInicio, horaFin }
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
