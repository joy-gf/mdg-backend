import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Initial Schema
 *
 * Creates all base tables in their pre-modification state.
 * Subsequent migrations will incrementally add columns and constraints.
 *
 * Tables NOT created here (handled by their own dedicated migrations):
 * - analisis_sentimiento (CreateAnalisisSentimiento1737900000000)
 * - registro_tareas_terapeuticas (CreateRegistroTareasTerapeuticas1738476405000)
 *
 * Columns NOT included (added by later migrations):
 * - psicologos.activo             → AddActivoToPacienteAndPsicologo1737670000000
 * - pacientes.activo              → AddActivoToPacienteAndPsicologo1737670000000
 * - pacientes.psicologo_id        → AddPsicologoIdToPacientes1769360000000
 * - historial_tratamiento.tareas_terapeuticas_list → AddTareasTerapeuticasList1737767000000
 * - historial_sesion.finalizada   → AddFinalizacionToHistorialSesion1760059260000
 * - historial_sesion.fecha_finalizacion → AddFinalizacionToHistorialSesion1760059260000
 * - diario_emocional.estado_analisis → AddEstadoAnalisisToDiario1737900001000
 * - citas.notas_cita              → AddNotasCitaAndNullablePaciente1738187000000
 * - citas.solicitada_por          → AddAppointmentRequestFields1738402800000
 * - citas.fecha_confirmacion      → AddAppointmentRequestFields1738402800000
 * - citas.motivo_rechazo          → AddAppointmentRequestFields1738402800000
 *
 * Type changes applied by later migrations:
 * - citas.fecha_sesion: TIMESTAMP → DATE (RefactorCitasFechaHoraTypes1738000000000)
 * - citas.hora_sesion: TIMESTAMP → TIME (RefactorCitasFechaHoraTypes1738000000000)
 * - diario_emocional.texto_entrada_encrypted → renamed to texto_entrada (RemoveDiarioEmocionalEncryption1737820000000)
 * - psicologos.ci: nullable → NOT NULL UNIQUE (UpdatePsicologoConstraints1705000000002)
 * - psicologos.matricula_profesional: nullable → NOT NULL UNIQUE (UpdatePsicologoConstraints1705000000002)
 * - citas.pacienteId: NOT NULL → nullable (AddNotasCitaAndNullablePaciente1738187000000)
 */
export class InitialSchema1699999999999 implements MigrationInterface {
  name = "InitialSchema1699999999999";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. roles (no dependencies)
    await queryRunner.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    // 2. consultorios (no dependencies)
    await queryRunner.query(`
      CREATE TABLE consultorios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // 3. usuarios (depends on roles)
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_name VARCHAR(150) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role_id UUID REFERENCES roles(id),
        active BOOLEAN NOT NULL DEFAULT true,
        created_date TIMESTAMP NOT NULL DEFAULT now(),
        updated_date TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // 4. psicologos
    // NOTE: ci and matricula_profesional are nullable here.
    //       UpdatePsicologoConstraints1705000000002 will make them NOT NULL UNIQUE.
    // NOTE: activo column is NOT included here.
    //       AddActivoToPacienteAndPsicologo1737670000000 will add it.
    await queryRunner.query(`
      CREATE TABLE psicologos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID NOT NULL UNIQUE,
        nombres VARCHAR(150) NOT NULL,
        apellidos VARCHAR(150) NOT NULL,
        email VARCHAR(150),
        telefono VARCHAR(50),
        direccion TEXT,
        ciudad VARCHAR(100),
        foto_perfil TEXT,
        fecha_nacimiento DATE,
        genero VARCHAR(30),
        ci VARCHAR(30),
        profesion VARCHAR(150),
        matricula_profesional VARCHAR(100),
        universidad VARCHAR(150),
        anios_experiencia INT,
        descripcion TEXT,
        especialidades TEXT[],
        fecha_creacion TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // 5. pacientes (depends on psicologos indirectly — psicologo_id added later)
    // NOTE: activo column is NOT included here.
    //       AddActivoToPacienteAndPsicologo1737670000000 will add it.
    // NOTE: psicologo_id FK is NOT included here.
    //       AddPsicologoIdToPacientes1769360000000 will add it.
    await queryRunner.query(`
      CREATE TABLE pacientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID,
        nombres VARCHAR(120) NOT NULL,
        apellidos VARCHAR(120) NOT NULL,
        ci VARCHAR(20) NOT NULL UNIQUE,
        fecha_nacimiento DATE NOT NULL,
        sexo VARCHAR(20),
        escolaridad VARCHAR(50),
        ocupacion VARCHAR(100),
        estado_civil VARCHAR(20),
        telefono VARCHAR(50),
        contacto_emergencia VARCHAR(200),
        direccion VARCHAR(200),
        fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `);

    // 6. antecedentes_paciente (depends on pacientes)
    await queryRunner.query(`
      CREATE TABLE antecedentes_paciente (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID NOT NULL,
        personales TEXT,
        familiares TEXT,
        medicos_psiquiatricos TEXT,
        CONSTRAINT fk_antecedentes_paciente
          FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
      )
    `);

    // 7. historial_tratamiento (depends on pacientes, psicologos)
    // NOTE: tareas_terapeuticas_list is NOT included here.
    //       AddTareasTerapeuticasList1737767000000 will add it.
    await queryRunner.query(`
      CREATE TABLE historial_tratamiento (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "pacienteId" UUID NOT NULL,
        "psicologoId" UUID,
        antecedentes_terapeuticos_previos_encrypted TEXT,
        consumo_sustancias BOOLEAN,
        consumo_detalle_encrypted TEXT,
        observaciones_clinicas_encrypted TEXT,
        hipotesis_diagnostica_encrypted TEXT,
        diagnostico_clinico_encrypted TEXT,
        tipo_intervencion VARCHAR(80),
        objetivo_general_encrypted TEXT,
        objetivos_especificos_encrypted TEXT,
        plan_trabajo_encrypted TEXT,
        numero_sesiones_tentativas INT,
        recomendaciones_iniciales_encrypted TEXT,
        tareas_terapeuticas TEXT,
        fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
        fecha_cierre DATE,
        comentarios_finales_encrypted TEXT,
        activo BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT fk_ht_paciente
          FOREIGN KEY ("pacienteId") REFERENCES pacientes(id) ON DELETE CASCADE,
        CONSTRAINT fk_ht_psicologo
          FOREIGN KEY ("psicologoId") REFERENCES psicologos(id) ON DELETE SET NULL
      )
    `);

    // 8. historial_sesion (depends on historial_tratamiento)
    // NOTE: finalizada and fecha_finalizacion are NOT included here.
    //       AddFinalizacionToHistorialSesion1760059260000 will add them.
    await queryRunner.query(`
      CREATE TABLE historial_sesion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tratamientoId" UUID NOT NULL,
        fecha_sesion DATE NOT NULL DEFAULT CURRENT_DATE,
        seguimiento_encrypted TEXT,
        recomendaciones_encrypted TEXT,
        fecha_proxima_sesion DATE,
        objetivos_proxima_sesion_encrypted TEXT,
        CONSTRAINT fk_hs_tratamiento
          FOREIGN KEY ("tratamientoId") REFERENCES historial_tratamiento(id) ON DELETE CASCADE
      )
    `);

    // 9. citas (depends on pacientes, psicologos, consultorios)
    // NOTE: fecha_sesion and hora_sesion start as TIMESTAMP.
    //       RefactorCitasFechaHoraTypes1738000000000 will convert them to DATE and TIME.
    // NOTE: pacienteId starts as NOT NULL.
    //       AddNotasCitaAndNullablePaciente1738187000000 will make it nullable.
    // NOTE: notas_cita, solicitada_por, fecha_confirmacion, motivo_rechazo are NOT included.
    //       They are added by later migrations.
    await queryRunner.query(`
      CREATE TABLE citas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "pacienteId" UUID NOT NULL,
        "psicologoId" UUID NOT NULL,
        "consultorioId" UUID,
        fecha_sesion TIMESTAMP NOT NULL,
        hora_sesion TIMESTAMP NOT NULL,
        duracion_minutos INT NOT NULL,
        tipo_cita VARCHAR(80) NOT NULL,
        direccion_cita VARCHAR(200),
        link_cita VARCHAR(200),
        estado VARCHAR(20) NOT NULL DEFAULT 'activa',
        CONSTRAINT fk_citas_paciente
          FOREIGN KEY ("pacienteId") REFERENCES pacientes(id),
        CONSTRAINT fk_citas_psicologo
          FOREIGN KEY ("psicologoId") REFERENCES psicologos(id),
        CONSTRAINT fk_citas_consultorio
          FOREIGN KEY ("consultorioId") REFERENCES consultorios(id)
      )
    `);

    // 10. diario_emocional (depends on pacientes)
    // NOTE: column is named texto_entrada_encrypted here.
    //       RemoveDiarioEmocionalEncryption1737820000000 will rename it to texto_entrada.
    // NOTE: estado_analisis is NOT included here.
    //       AddEstadoAnalisisToDiario1737900001000 will add it.
    await queryRunner.query(`
      CREATE TABLE diario_emocional (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID NOT NULL,
        fecha_entrada DATE NOT NULL,
        emocion_seleccionada VARCHAR(50) NOT NULL,
        texto_entrada_encrypted TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_diario_paciente
          FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS diario_emocional`);
    await queryRunner.query(`DROP TABLE IF EXISTS citas`);
    await queryRunner.query(`DROP TABLE IF EXISTS historial_sesion`);
    await queryRunner.query(`DROP TABLE IF EXISTS historial_tratamiento`);
    await queryRunner.query(`DROP TABLE IF EXISTS antecedentes_paciente`);
    await queryRunner.query(`DROP TABLE IF EXISTS pacientes`);
    await queryRunner.query(`DROP TABLE IF EXISTS psicologos`);
    await queryRunner.query(`DROP TABLE IF EXISTS usuarios`);
    await queryRunner.query(`DROP TABLE IF EXISTS consultorios`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
  }
}
