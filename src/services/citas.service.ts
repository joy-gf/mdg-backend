import { DeepPartial } from "typeorm";
import { AppDataSource } from "../config/datasource";
import { Cita, SolicitadaPor } from "../entities/Cita.entity";
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
    pacienteId?: string;
    psicologoId: string;
    consultorioId?: string;
    fecha_sesion: string;
    hora_sesion: string;
    duracion_minutos: number;
    tipo_cita: string;
    direccion_cita?: string;
    link_cita?: string;
    notas_cita?: string;
    solicitada_por?: "paciente" | "psicologo";
  }) {

   if (!data.pacienteId && !data.notas_cita) {
      throw new Error("Debe proporcionar un pacienteId o notas_cita para identificar al paciente");
    }

    // Asegurar formato correcto de la hora
    let horaFormateada = data.hora_sesion;
    if (horaFormateada && horaFormateada.split(':').length === 2) {
      horaFormateada = `${horaFormateada}:00`;
    }

    const fechaHoraISO = `${data.fecha_sesion}T${horaFormateada}`;
    const inicio = new Date(fechaHoraISO);

    if (isNaN(inicio.getTime())) {
      throw new Error(`Fecha/hora inválida: ${fechaHoraISO}`);
    }

    const fin = new Date(inicio.getTime() + data.duracion_minutos * 60000);

    await this.validarDisponibilidad(
      data.consultorioId!,
      data.psicologoId,
      inicio,
      fin
    );

    const citaData: DeepPartial<Cita> = {
      paciente: data.pacienteId ? ({ id: data.pacienteId } as Paciente) : null,
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
      notas_cita: data.notas_cita || null,
      solicitada_por: (data.solicitada_por as SolicitadaPor) || SolicitadaPor.PSICOLOGO,
      estado: "activa",
    };
    const cita = this.repo.create(citaData);

    return this.repo.save(cita);
  }

  static async solicitar(data: {
    pacienteId: string;
    psicologoId: string;
    fecha_sesion: string;
    hora_sesion: string;
    duracion_minutos: number;
    tipo_cita: string;
    direccion_cita?: string;
    notas_cita?: string;
  }) {
    // Validar que el paciente no pase consultorio ni link (lo asigna el psicólogo al confirmar)
    // Asegurar formato correcto de la hora
    let horaFormateada = data.hora_sesion;
    if (horaFormateada && horaFormateada.split(':').length === 2) {
      horaFormateada = `${horaFormateada}:00`;
    }

    const fechaHoraISO = `${data.fecha_sesion}T${horaFormateada}`;
    const inicio = new Date(fechaHoraISO);

    if (isNaN(inicio.getTime())) {
      throw new Error(`Fecha/hora inválida: ${fechaHoraISO}`);
    }

    const fin = new Date(inicio.getTime() + data.duracion_minutos * 60000);

    // Validar disponibilidad del psicólogo (no consultorio aún)
    await this.validarDisponibilidadPsicologo(
      data.psicologoId,
      inicio,
      fin
    );

    const solicitudData: DeepPartial<Cita> = {
      paciente: { id: data.pacienteId } as Paciente,
      psicologo: { id: data.psicologoId } as Psicologo,
      consultorio: null,
      fecha_sesion: data.fecha_sesion,
      hora_sesion: data.hora_sesion,
      duracion_minutos: data.duracion_minutos,
      tipo_cita: data.tipo_cita,
      direccion_cita: data.direccion_cita || undefined,
      link_cita: undefined,
      notas_cita: data.notas_cita || undefined,
      solicitada_por: SolicitadaPor.PACIENTE,
      estado: "pendiente",
    };
    const cita = this.repo.create(solicitudData);

    return this.repo.save(cita);
  }

  static async confirmar(
    id: string,
    data: {
      consultorioId?: string;
      link_cita?: string;
      direccion_cita?: string;
      notas_cita?: string;
    }
  ) {
    const cita = await this.repo.findOne({
      where: { id },
      relations: ["psicologo", "paciente"],
    });

    if (!cita) {
      throw new Error("Cita no encontrada");
    }

    if (cita.estado !== "pendiente") {
      throw new Error("Solo se pueden confirmar citas en estado pendiente");
    }

    // Validar que se proporcionen los recursos necesarios según el tipo de cita
    if (cita.tipo_cita === "Presencial" && !data.consultorioId) {
      throw new Error("Debe proporcionar un consultorio para citas presenciales");
    }

    if (cita.tipo_cita === "Virtual" && !data.link_cita) {
      throw new Error("Debe proporcionar un link para citas virtuales");
    }

    // Validar disponibilidad con el consultorio asignado
    console.log('Datos de cita para validación:', {
      fecha_sesion: cita.fecha_sesion,
      hora_sesion: cita.hora_sesion,
      duracion_minutos: cita.duracion_minutos
    });

    // Asegurar formato correcto de la hora (HH:mm o HH:mm:ss)
    let horaFormateada = cita.hora_sesion;
    if (horaFormateada && horaFormateada.split(':').length === 2) {
      horaFormateada = `${horaFormateada}:00`;
    }

    const fechaHoraISO = `${cita.fecha_sesion}T${horaFormateada}`;
    console.log('fechaHoraISO construido:', fechaHoraISO);

    const inicio = new Date(fechaHoraISO);
    if (isNaN(inicio.getTime())) {
      throw new Error(`Fecha/hora inválida: ${fechaHoraISO}`);
    }

    const fin = new Date(inicio.getTime() + cita.duracion_minutos * 60000);

    if (data.consultorioId) {
      await this.validarDisponibilidad(
        data.consultorioId,
        cita.psicologo.id,
        inicio,
        fin
      );
    }

    // Actualizar la cita
    const updateData: any = {
      estado: "activa",
      fecha_confirmacion: new Date(),
    };

    if (data.consultorioId) {
      updateData.consultorio = { id: data.consultorioId } as Consultorio;
    }
    if (data.link_cita !== undefined) {
      updateData.link_cita = data.link_cita;
    }
    if (data.direccion_cita !== undefined) {
      updateData.direccion_cita = data.direccion_cita;
    }
    if (data.notas_cita !== undefined) {
      updateData.notas_cita = data.notas_cita;
    }

    await this.repo.update(id, updateData);
    return this.repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo", "consultorio"],
    });
  }

  static async rechazar(id: string, motivo?: string) {
    const cita = await this.repo.findOne({
      where: { id },
      relations: ["psicologo", "paciente"],
    });

    if (!cita) {
      throw new Error("Cita no encontrada");
    }

    if (cita.estado !== "pendiente") {
      throw new Error("Solo se pueden rechazar citas en estado pendiente");
    }

    await this.repo.update(id, {
      estado: "rechazada",
      motivo_rechazo: motivo || null,
    });

    return this.repo.findOne({
      where: { id },
      relations: ["paciente", "psicologo", "consultorio"],
    });
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
      notas_cita?: string | null;
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
      // Asegurar formato correcto de la hora
      let horaFinal = data.hora_sesion || cita.hora_sesion;
      if (horaFinal && horaFinal.split(':').length === 2) {
        horaFinal = `${horaFinal}:00`;
      }

      const fechaHoraISO = `${data.fecha_sesion || cita.fecha_sesion}T${horaFinal}`;
      const inicio = new Date(fechaHoraISO);

      if (isNaN(inicio.getTime())) {
        throw new Error(`Fecha/hora inválida: ${fechaHoraISO}`);
      }

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
    if (data.notas_cita !== undefined) updateData.notas_cita = data.notas_cita;

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

    // Verificar conflicto con consultorio (solo citas confirmadas y reprogramadas)
    if (consultorioId) {
      const conflictoConsultorio = await this.repo
        .createQueryBuilder("c")
        .where("c.estado IN ('activa', 'reprogramada')")
        .andWhere("c.fecha_sesion = :fecha", { fecha: fechaInicio })
        .andWhere(
          "(c.hora_sesion < :horaFin AND (c.hora_sesion + (c.duracion_minutos || ' minutes')::interval) > :horaInicio)",
          { horaInicio, horaFin }
        )
        .andWhere("c.consultorioId = :consultorioId", { consultorioId })
        .getOne();

      if (conflictoConsultorio) {
        const error = new Error("El consultorio ya está ocupado en ese horario");
        (error as any).conflictType = "consultorio";
        (error as any).conflictHora = conflictoConsultorio.hora_sesion;
        throw error;
      }
    }

    // Verificar conflicto con psicólogo (solo citas confirmadas y reprogramadas)
    const conflictoPsicologo = await this.repo
      .createQueryBuilder("c")
      .where("c.estado IN ('activa', 'reprogramada')")
      .andWhere("c.fecha_sesion = :fecha", { fecha: fechaInicio })
      .andWhere(
        "(c.hora_sesion < :horaFin AND (c.hora_sesion + (c.duracion_minutos || ' minutes')::interval) > :horaInicio)",
        { horaInicio, horaFin }
      )
      .andWhere("c.psicologoId = :psicologoId", { psicologoId })
      .getOne();

    if (conflictoPsicologo) {
      const error = new Error("Ya tienes otra cita agendada en este horario");
      (error as any).conflictType = "psicologo";
      (error as any).conflictHora = conflictoPsicologo.hora_sesion;
      throw error;
    }
  }

  static async validarDisponibilidadPsicologo(
    psicologoId: string,
    inicio: Date,
    fin: Date
  ) {
    const fechaInicio = inicio.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaInicio = inicio.toTimeString().slice(0, 8); // HH:mm:ss
    const horaFin = fin.toTimeString().slice(0, 8); // HH:mm:ss

    // Solo verificar conflicto con psicólogo (solo citas confirmadas y reprogramadas)
    const conflictoPsicologo = await this.repo
      .createQueryBuilder("c")
      .where("c.estado IN ('activa', 'reprogramada')")
      .andWhere("c.fecha_sesion = :fecha", { fecha: fechaInicio })
      .andWhere(
        "(c.hora_sesion < :horaFin AND (c.hora_sesion + (c.duracion_minutos || ' minutes')::interval) > :horaInicio)",
        { horaInicio, horaFin }
      )
      .andWhere("c.psicologoId = :psicologoId", { psicologoId })
      .getOne();

    if (conflictoPsicologo) {
      const error = new Error("El psicólogo ya tiene una cita agendada en este horario");
      (error as any).conflictType = "psicologo";
      (error as any).conflictHora = conflictoPsicologo.hora_sesion;
      throw error;
    }
  }
}
