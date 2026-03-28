import { Table, TableIndex, TableForeignKey } from "typeorm";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRegistroTareasTerapeuticas1738476405000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "registro_tareas_terapeuticas",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "gen_random_uuid()",
                    },
                    {
                        name: "paciente_id",
                        type: "uuid",
                        isNullable: false,
                    },
                    {
                        name: "tipo_tarea",
                        type: "varchar",
                        length: "50",
                        isNullable: false,
                    },
                    {
                        name: "fecha",
                        type: "date",
                        isNullable: false,
                    },
                    {
                        name: "actividades_realizadas",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "veces_completado",
                        type: "integer",
                        default: 0,
                    },
                    {
                        name: "tiempo_total_segundos",
                        type: "integer",
                        default: 0,
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Create indexes
        await queryRunner.createIndex(
            "registro_tareas_terapeuticas",
            new TableIndex({
                name: "idx_registro_tareas_paciente",
                columnNames: ["paciente_id"],
            })
        );

        await queryRunner.createIndex(
            "registro_tareas_terapeuticas",
            new TableIndex({
                name: "idx_registro_tareas_fecha",
                columnNames: ["fecha"],
            })
        );

        await queryRunner.createIndex(
            "registro_tareas_terapeuticas",
            new TableIndex({
                name: "idx_registro_tareas_tipo",
                columnNames: ["tipo_tarea"],
            })
        );

        // Create foreign key
        await queryRunner.createForeignKey(
            "registro_tareas_terapeuticas",
            new TableForeignKey({
                name: "fk_registro_tareas_paciente",
                columnNames: ["paciente_id"],
                referencedTableName: "pacientes",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("registro_tareas_terapeuticas");
    }
}
