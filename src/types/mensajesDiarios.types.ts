export interface MensajeDiarioOutput {
  id: string;
  paciente_id: string;
  fecha: Date;
  emocion_detectada: string;
  mensaje: string;
  created_at: Date;
}

export type EmocionTipo =
  | "tristeza"
  | "ansiedad"
  | "enojo"
  | "miedo"
  | "soledad"
  | "frustración"
  | "alegría"
  | "calma"
  | "neutral";
