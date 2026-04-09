import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabase1680000000000 implements MigrationInterface {
  name = "InitDatabase1680000000000";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`

-- =========================
-- EXTENSIONES
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- TABLAS BASE
-- =========================

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name varchar(150) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_date timestamp NOT NULL DEFAULT now(),
  updated_date timestamp NOT NULL DEFAULT now(),
  role_id uuid,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE consultorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(150) NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid,
  nombres varchar(120) NOT NULL,
  apellidos varchar(120) NOT NULL,
  fecha_nacimiento date NOT NULL,
  sexo varchar(20),
  escolaridad varchar(50),
  ocupacion varchar(100),
  estado_civil varchar(20),
  telefono varchar(50),
  contacto_emergencia varchar(200),
  direccion varchar(200),
  fecha_ingreso date NOT NULL DEFAULT now(),
  ci varchar(20) NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  psicologo_id uuid
);

CREATE TABLE psicologos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE,
  nombres varchar(150) NOT NULL,
  apellidos varchar(150) NOT NULL,
  email varchar(150),
  telefono varchar(50),
  direccion text,
  ciudad varchar(100),
  foto_perfil text,
  fecha_nacimiento date,
  genero varchar(30),
  ci varchar(30) NOT NULL UNIQUE,
  profesion varchar(150),
  matricula_profesional varchar(100) NOT NULL UNIQUE,
  universidad varchar(150),
  anios_experiencia int,
  descripcion text,
  especialidades text[],
  fecha_creacion timestamp NOT NULL DEFAULT now(),
  activo boolean NOT NULL DEFAULT true
);

-- =========================
-- TABLAS INTERMEDIAS
-- =========================

CREATE TABLE diario_emocional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  fecha_entrada date NOT NULL,
  emocion_seleccionada varchar(50) NOT NULL,
  texto_entrada text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  estado_analisis varchar(20) NOT NULL DEFAULT 'pendiente',
  CONSTRAINT fk_diario_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

CREATE TABLE antecedentes_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  personales text,
  familiares text,
  medicos_psiquiatricos text,
  CONSTRAINT fk_antecedente_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

CREATE TABLE historial_tratamiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_inicio date NOT NULL DEFAULT now(),
  fecha_cierre date,
  activo boolean NOT NULL DEFAULT true,
  pacienteId uuid,
  psicologoId uuid,
  consumo_sustancias boolean,
  tipo_intervencion varchar(80),
  numero_sesiones_tentativas int,
  antecedentes_terapeuticos_previos_encrypted text,
  consumo_detalle_encrypted text,
  observaciones_clinicas_encrypted text,
  hipotesis_diagnostica_encrypted text,
  diagnostico_clinico_encrypted text,
  objetivo_general_encrypted text,
  objetivos_especificos_encrypted text,
  plan_trabajo_encrypted text,
  recomendaciones_iniciales_encrypted text,
  comentarios_finales_encrypted text,
  tareas_terapeuticas text,
  tareas_terapeuticas_list text,
  CONSTRAINT fk_tratamiento_paciente FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_tratamiento_psicologo FOREIGN KEY (psicologoId) REFERENCES psicologos(id) ON DELETE SET NULL
);

CREATE TABLE citas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_sesion date NOT NULL,
  hora_sesion time NOT NULL,
  duracion_minutos int NOT NULL,
  tipo_cita varchar(80) NOT NULL,
  direccion_cita varchar(200),
  link_cita varchar(200),
  pacienteId uuid,
  psicologoId uuid NOT NULL,
  consultorioId uuid,
  notas_cita text,
  solicitada_por varchar(20),
  fecha_confirmacion timestamp,
  motivo_rechazo text,
  estado varchar(20) NOT NULL DEFAULT 'activa',
  CONSTRAINT fk_cita_paciente FOREIGN KEY (pacienteId) REFERENCES pacientes(id),
  CONSTRAINT fk_cita_psicologo FOREIGN KEY (psicologoId) REFERENCES psicologos(id),
  CONSTRAINT fk_cita_consultorio FOREIGN KEY (consultorioId) REFERENCES consultorios(id)
);

-- =========================
-- TABLAS AVANZADAS
-- =========================

CREATE TABLE historial_sesion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_sesion date NOT NULL DEFAULT now(),
  tratamientoId uuid,
  fecha_proxima_sesion date,
  seguimiento_encrypted text,
  recomendaciones_encrypted text,
  objetivos_proxima_sesion_encrypted text,
  finalizada boolean NOT NULL DEFAULT false,
  fecha_finalizacion timestamp,
  CONSTRAINT fk_sesion_tratamiento FOREIGN KEY (tratamientoId) REFERENCES historial_tratamiento(id) ON DELETE CASCADE
);

CREATE TABLE analisis_sentimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diario_emocional_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  fecha_analisis date NOT NULL,
  sentimiento_general varchar(20) NOT NULL,
  confianza numeric(5,4) NOT NULL,
  score_positivo numeric(5,4) NOT NULL DEFAULT 0,
  score_negativo numeric(5,4) NOT NULL DEFAULT 0,
  score_neutral numeric(5,4) NOT NULL DEFAULT 0,
  emocion_predominante varchar(50),
  palabras_clave jsonb,
  alertas jsonb,
  modelo_usado varchar(255),
  created_at timestamp NOT NULL DEFAULT now(),
  nota_validacion_psicologo text,
  CONSTRAINT fk_sentimiento_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_sentimiento_diario FOREIGN KEY (diario_emocional_id) REFERENCES diario_emocional(id) ON DELETE CASCADE
);

CREATE TABLE registro_tareas_terapeuticas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  tipo_tarea varchar(50) NOT NULL,
  fecha date NOT NULL,
  actividades_realizadas text,
  veces_completado int NOT NULL DEFAULT 0,
  tiempo_total_segundos int NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_tarea_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- =========================
-- INDICES
-- =========================

CREATE INDEX idx_tareas_fecha ON registro_tareas_terapeuticas(fecha);
CREATE INDEX idx_tareas_paciente ON registro_tareas_terapeuticas(paciente_id);
CREATE INDEX idx_tareas_tipo ON registro_tareas_terapeuticas(tipo_tarea);

CREATE UNIQUE INDEX idx_tareas_unique 
ON registro_tareas_terapeuticas(paciente_id, tipo_tarea, fecha);

    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`

DROP TABLE IF EXISTS analisis_sentimiento;
DROP TABLE IF EXISTS historial_sesion;
DROP TABLE IF EXISTS registro_tareas_terapeuticas;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS historial_tratamiento;
DROP TABLE IF EXISTS antecedentes_paciente;
DROP TABLE IF EXISTS diario_emocional;
DROP TABLE IF EXISTS psicologos;
DROP TABLE IF EXISTS pacientes;
DROP TABLE IF EXISTS consultorios;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

    `);
  }
}