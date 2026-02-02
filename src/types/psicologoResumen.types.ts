export interface ResumenPacientePsicologo {
  paciente_id: string;
  paciente_nombre: string;
  paciente_apellido: string;
  fecha_ultima_cita: string | null;
  total_sesiones: number;
  sesiones_finalizadas: number;
  tratamiento_activo: boolean;
}
