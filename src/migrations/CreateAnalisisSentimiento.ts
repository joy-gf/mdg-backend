import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Analisis Sentimiento Table
 *
 * Tabla para almacenar análisis de sentimientos del diario emocional
 */
export class CreateAnalisisSentimiento1737900000000 implements MigrationInterface {
  name = "CreateAnalisisSentimiento1737900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("📝 Creando tabla analisis_sentimiento...");

    await queryRunner.query(`
      CREATE TABLE analisis_sentimiento (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        diario_emocional_id UUID NOT NULL,
        paciente_id UUID NOT NULL,
        fecha_analisis DATE NOT NULL,

        -- Sentimiento general
        sentimiento_general VARCHAR(20) NOT NULL CHECK (sentimiento_general IN ('esperanzador', 'desafiante', 'equilibrado')),
        confianza DECIMAL(5,4) NOT NULL CHECK (confianza >= 0 AND confianza <= 1),

        -- Scores
        score_positivo DECIMAL(5,4) NOT NULL DEFAULT 0,
        score_negativo DECIMAL(5,4) NOT NULL DEFAULT 0,
        score_neutral DECIMAL(5,4) NOT NULL DEFAULT 0,

        -- Emoción predominante detectada del texto
        emocion_predominante VARCHAR(50),

        -- Palabras clave (JSON array)
        palabras_clave JSONB,

        -- Alertas detectadas (JSON array)
        alertas JSONB,

        -- Metadata
        modelo_usado VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_analisis_diario
          FOREIGN KEY (diario_emocional_id)
          REFERENCES diario_emocional(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_analisis_paciente
          FOREIGN KEY (paciente_id)
          REFERENCES paciente(id)
          ON DELETE CASCADE
      )
    `);

    // Índices para búsquedas eficientes
    await queryRunner.query(`
      CREATE INDEX idx_analisis_paciente_fecha
      ON analisis_sentimiento(paciente_id, fecha_analisis DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_analisis_diario
      ON analisis_sentimiento(diario_emocional_id)
    `);

    console.log("Tabla analisis_sentimiento creada exitosamente");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("Eliminando tabla analisis_sentimiento...");

    await queryRunner.query(`DROP TABLE IF EXISTS analisis_sentimiento CASCADE`);

    console.log("Tabla eliminada");
  }
}
