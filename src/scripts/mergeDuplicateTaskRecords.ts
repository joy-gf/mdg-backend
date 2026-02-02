import { AppDataSource } from "../config/datasource";
import { RegistroTareasTerapeuticas } from "../entities/RegistroTareasTerapeuticas.entity";

/**
 * Script to identify and merge duplicate task records
 * Run with: npx ts-node src/scripts/mergeDuplicateTaskRecords.ts
 */

interface DuplicateGroup {
  paciente_id: string;
  tipo_tarea: string;
  fecha: string;
  count: number;
}

async function mergeDuplicateTaskRecords() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    const repo = AppDataSource.getRepository(RegistroTareasTerapeuticas);

    // Find duplicate groups (same paciente_id + tipo_tarea + fecha)
    const duplicates = await repo
      .createQueryBuilder("registro")
      .select("registro.paciente_id", "paciente_id")
      .addSelect("registro.tipo_tarea", "tipo_tarea")
      .addSelect("registro.fecha", "fecha")
      .addSelect("COUNT(*)", "count")
      .groupBy("registro.paciente_id")
      .addGroupBy("registro.tipo_tarea")
      .addGroupBy("registro.fecha")
      .having("COUNT(*) > 1")
      .getRawMany();

    if (duplicates.length === 0) {
      console.log("✅ No duplicate records found!");
      await AppDataSource.destroy();
      return;
    }

    console.log(`🔍 Found ${duplicates.length} duplicate groups`);

    let mergedCount = 0;

    for (const dup of duplicates as DuplicateGroup[]) {
      const { paciente_id, tipo_tarea, fecha, count } = dup;

      console.log(
        `\n📋 Processing: ${tipo_tarea} - ${fecha} (${count} duplicates)`
      );

      // Get all records in this group
      const records = await repo.find({
        where: {
          paciente_id,
          tipo_tarea: tipo_tarea as any,
          fecha: new Date(fecha) as any,
        },
        order: { created_at: "ASC" }, // Keep the oldest one
      });

      if (records.length <= 1) continue;

      // Keep the first (oldest) record and merge others into it
      const [primary, ...duplicatesToMerge] = records;

      console.log(`  ↳ Primary record ID: ${primary.id}`);
      console.log(`  ↳ Merging ${duplicatesToMerge.length} duplicates...`);

      // Merge data
      for (const record of duplicatesToMerge) {
        if (tipo_tarea === "registro_actividades") {
          // For activities, merge and deduplicate arrays
          const existingActividades = primary.actividades_realizadas || [];
          const newActividades = record.actividades_realizadas || [];
          primary.actividades_realizadas = Array.from(
            new Set([...existingActividades, ...newActividades])
          );
        } else {
          // For other tasks, sum counters
          primary.veces_completado += record.veces_completado || 0;
          primary.tiempo_total_segundos += record.tiempo_total_segundos || 0;
        }

        // Merge metadata
        if (record.metadata) {
          primary.metadata = {
            ...primary.metadata,
            ...record.metadata,
          };
        }
      }

      // Save merged record
      await repo.save(primary);

      // Delete duplicates
      await repo.remove(duplicatesToMerge);

      console.log(`  ✅ Merged successfully`);
      mergedCount++;
    }

    console.log(`\n🎉 Successfully merged ${mergedCount} duplicate groups!`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Error merging duplicates:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  mergeDuplicateTaskRecords();
}

export { mergeDuplicateTaskRecords };
