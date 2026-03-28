export type TipoTareaTerapeutica =
  | "registro_actividades"
  | "ejercicios_gratitud"
  | "higiene_sueno"
  | "ejercicios_respiracion";

export interface RegistroTareaInput {
  paciente_id: string;
  tipo_tarea: TipoTareaTerapeutica;
  fecha: string; // YYYY-MM-DD format to avoid timezone issues
  actividades_realizadas?: string[];
  veces_completado?: number;
  tiempo_total_segundos?: number;
  metadata?: Record<string, any>;
}

export interface RegistroTareaOutput {
  id: string;
  paciente_id: string;
  tipo_tarea: TipoTareaTerapeutica;
  fecha: Date;
  actividades_realizadas: string[] | null;
  veces_completado: number;
  tiempo_total_segundos: number;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}
