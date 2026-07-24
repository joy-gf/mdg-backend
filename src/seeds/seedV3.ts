/**
 * Seed V3 — Refresh de datos clínicos (Abril 1 → Julio 30, 2026)
 *
 * A diferencia de seed.ts / seedOF.ts / seedV2.ts, este script NO trunca
 * usuarios/psicologos/pacientes/consultorios/roles. Solo:
 *   1. Agrega pacientes nuevos (hasta llegar a ~6 por psicólogo) — con
 *      usuario/contraseña únicamente si les toca al menos una tarea
 *      terapéutica.
 *   2. Borra y regenera TODA la data clínica (antecedentes, tratamientos,
 *      sesiones, citas, diario emocional, análisis de sentimiento, tareas
 *      terapéuticas) para TODOS los pacientes (existentes + nuevos).
 *
 * Ejecutar con: npm run seed:v3
 */

import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "../config/datasource";
import { encryptText, deriveKey } from "../utils/crypto.util";

const ENC_KEY = deriveKey(
  process.env.ENCRYPTION_SECRET ?? "default-dev-secret-change-in-production"
);
function enc(plain: string): string {
  return JSON.stringify(encryptText(plain, ENC_KEY));
}

// ══════════════════════════════════════════════════════════
// RANGO DE FECHAS
// ══════════════════════════════════════════════════════════
const START = "2026-04-01";
const END = "2026-07-30";
const TODAY = "2026-07-22"; // citas <= TODAY = finalizada (con sesión); > TODAY = activa (sin sesión aún)

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}
function dowMonday0(dateStr: string): number {
  // 0=Lunes .. 6=Domingo
  const jsDay = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0=Dom..6=Sab
  return (jsDay + 6) % 7;
}
function weeklyDates(start: string, end: string, targetDow: number): string[] {
  const dates: string[] = [];
  let cur = start;
  // avanzar hasta el primer día que coincida con targetDow
  while (dowMonday0(cur) !== targetDow) cur = addDays(cur, 1);
  while (cur <= end) {
    dates.push(cur);
    cur = addDays(cur, 7);
  }
  return dates;
}

// ══════════════════════════════════════════════════════════
// SLOT TRACKING (evita choques de psicólogo/consultorio)
// ══════════════════════════════════════════════════════════
const usedConsSlots = new Set<string>();
const usedPsicoSlots = new Set<string>();
const HOURS = ["08:00:00", "09:00:00", "10:00:00", "11:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00"];

function findSlot(date: string, psicoId: string, consultorios: string[]): { hora: string; consId: string } | null {
  for (const hora of HOURS) {
    const pKey = `${date}|${hora}|${psicoId}`;
    if (usedPsicoSlots.has(pKey)) continue;
    for (const consId of consultorios) {
      const cKey = `${date}|${hora}|${consId}`;
      if (!usedConsSlots.has(cKey)) {
        usedConsSlots.add(cKey);
        usedPsicoSlots.add(pKey);
        return { hora, consId };
      }
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════
// ARCHETIPOS DE TRATAMIENTO (se ciclan entre los 30 pacientes)
// ══════════════════════════════════════════════════════════
type TipoTarea = "registro_actividades" | "ejercicios_gratitud" | "higiene_sueno" | "ejercicios_respiracion";

interface Archetype {
  tipo: string;
  obs: string;
  hipotesis: string;
  diagnostico: string;
  objetivo: string;
  plan: string;
  tareasTexto: string;
  tareasList: string[]; // puede incluir "Diario emocional" además de los TipoTarea
  numeroSesiones: number;
  consumo: boolean;
  trend: "positivo" | "mixto" | "dificil";
}

const ARCHETYPES: Archetype[] = [
  { tipo: "Cognitivo-Conductual", consumo: false, trend: "positivo", numeroSesiones: 16,
    obs: "Paciente presenta ansiedad con episodios de pánico situacionales. Evitación significativa.",
    hipotesis: "Trastorno de ansiedad generalizada con ataques de pánico situacionales.",
    diagnostico: "TAG con componente fóbico situacional.",
    objetivo: "Reducir frecuencia e intensidad de ataques de pánico. Desarrollar tolerancia a la incertidumbre.",
    plan: "Psicoeducación, reestructuración cognitiva, técnicas de respiración y exposición gradual.",
    tareasTexto: "Practicar respiración 4-7-8 diariamente. Registrar pensamientos ansiosos en diario. Exposición gradual.",
    tareasList: ["ejercicios_respiracion", "registro_actividades", "Diario emocional"] },
  { tipo: "Cognitivo-Conductual", consumo: false, trend: "mixto", numeroSesiones: 20,
    obs: "Episodio depresivo con anhedonia, anergia y aislamiento social.",
    hipotesis: "Episodio depresivo de intensidad moderada.",
    diagnostico: "Depresión mayor, primer episodio.",
    objetivo: "Remisión del episodio depresivo. Activación conductual. Prevención de recaídas.",
    plan: "Activación conductual, registro de pensamientos, intervención en red social, higiene del sueño.",
    tareasTexto: "Activación conductual: una actividad placentera por día. Higiene del sueño. Registro de logros diarios.",
    tareasList: ["registro_actividades", "higiene_sueno", "ejercicios_gratitud"] },
  { tipo: "Terapia Breve Centrada en Soluciones", consumo: false, trend: "positivo", numeroSesiones: 12,
    obs: "Burnout laboral con afectación familiar. Dificultad para establecer límites.",
    hipotesis: "Síndrome de burnout con dificultad en establecimiento de límites.",
    diagnostico: "Burnout laboral (CIE-11 QD85).",
    objetivo: "Establecer límites laborales saludables. Recuperar balance vida-trabajo.",
    plan: "Manejo del estrés, entrenamiento en asertividad, reestructuración de prioridades.",
    tareasTexto: "Salir del trabajo a la hora acordada. Pausas activas cada 2 horas. Tiempo de calidad con familia.",
    tareasList: ["registro_actividades", "ejercicios_respiracion"] },
  { tipo: "Cognitivo-Conductual", consumo: false, trend: "positivo", numeroSesiones: 16,
    obs: "Ansiedad social con evitación de exposición pública.",
    hipotesis: "Trastorno de ansiedad social (fobia social).",
    diagnostico: "Fobia social, forma generalizada.",
    objetivo: "Reducir ansiedad en situaciones sociales. Ampliar repertorio de interacciones.",
    plan: "Exposición gradual, entrenamiento en habilidades sociales, desafío de creencias catastróficas.",
    tareasTexto: "Iniciar una conversación breve por día. Registrar situaciones sociales y nivel de ansiedad.",
    tareasList: ["registro_actividades", "ejercicios_respiracion"] },
  { tipo: "Terapia de Duelo y Trauma", consumo: true, trend: "mixto", numeroSesiones: 20,
    obs: "Trauma por separación reciente, consumo de alcohol como evitación.",
    hipotesis: "Trastorno adaptativo con estado de ánimo depresivo y conductas de evitación.",
    diagnostico: "Trastorno adaptativo post-separación con componente de duelo.",
    objetivo: "Elaborar el duelo de la relación. Establecer nueva identidad. Eliminar consumo de alcohol.",
    plan: "Terapia de duelo, técnicas narrativas, psicoeducación sobre alcohol como evitación, red de apoyo.",
    tareasTexto: "Diario narrativo del duelo. Actividades significativas. Registro de días sin consumo.",
    tareasList: ["registro_actividades", "ejercicios_gratitud", "Diario emocional"] },
  { tipo: "Terapia de Duelo", consumo: false, trend: "positivo", numeroSesiones: 16,
    obs: "Duelo por fallecimiento de familiar cercano. Primera consulta psicológica.",
    hipotesis: "Duelo normal en etapa de elaboración activa.",
    diagnostico: "Duelo por pérdida de figura significativa.",
    objetivo: "Acompañar el proceso de elaboración del duelo. Prevenir complicaciones.",
    plan: "Trabajo narrativo del duelo, rituales simbólicos, integración de la pérdida, red de apoyo familiar.",
    tareasTexto: "Ritual de memoria semanal. Contacto regular con familia.",
    tareasList: ["registro_actividades", "ejercicios_gratitud", "Diario emocional"] },
  { tipo: "Terapia Sistémica Familiar", consumo: false, trend: "mixto", numeroSesiones: 12,
    obs: "Conflicto familiar crónico. Estrés de pareja secundario.",
    hipotesis: "Disfunción familiar con patrones de comunicación inadecuados.",
    diagnostico: "Problemática relacional familiar.",
    objetivo: "Mejorar comunicación familiar. Establecer límites. Fortalecer vínculo de pareja.",
    plan: "Mapeo de patrones relacionales, entrenamiento en comunicación asertiva, trabajo en límites.",
    tareasTexto: "Comunicar límites de forma asertiva. Tiempo de pareja semanal.",
    tareasList: ["registro_actividades"] },
  { tipo: "Cognitivo-Conductual (ERP)", consumo: false, trend: "positivo", numeroSesiones: 20,
    obs: "TOC leve con rituales de comprobación que afectan el funcionamiento diario.",
    hipotesis: "Trastorno obsesivo-compulsivo de intensidad leve-moderada.",
    diagnostico: "TOC con rituales de comprobación.",
    objetivo: "Reducir rituales compulsivos. Aumentar tolerancia a la incertidumbre.",
    plan: "Psicoeducación sobre TOC, exposición con prevención de respuesta (ERP), reestructuración cognitiva.",
    tareasTexto: "Exposición diaria reduciendo revisiones. Técnica STOP ante pensamiento intruso.",
    tareasList: ["ejercicios_respiracion", "registro_actividades"] },
  { tipo: "Cognitivo-Conductual", consumo: false, trend: "mixto", numeroSesiones: 24,
    obs: "Restricción alimentaria con distorsión de imagen corporal. Perfeccionismo elevado.",
    hipotesis: "Trastorno de la conducta alimentaria no especificado.",
    diagnostico: "TCA-NE con restricción y distorsión de imagen corporal.",
    objetivo: "Normalizar la conducta alimentaria. Mejorar la imagen corporal. Reducir el perfeccionismo.",
    plan: "Psicoeducación nutricional, diario alimentario, trabajo en imagen corporal, reestructuración cognitiva.",
    tareasTexto: "Diario alimentario diario. Mindfulness tras cada comida.",
    tareasList: ["registro_actividades", "ejercicios_respiracion", "Diario emocional"] },
  { tipo: "Cognitivo-Conductual", consumo: false, trend: "positivo", numeroSesiones: 16,
    obs: "Trastorno de pánico con evitación de conducción. Impacto funcional significativo.",
    hipotesis: "Trastorno de pánico con agorafobia situacional.",
    diagnostico: "Trastorno de pánico con evitación fóbica.",
    objetivo: "Eliminar los ataques de pánico. Recuperar autonomía funcional.",
    plan: "Psicoeducación, técnicas de respiración y relajación, exposición interoceptiva, exposición in vivo gradual.",
    tareasTexto: "Respiración 4-7-8 preventiva. Exposición gradual con registro.",
    tareasList: ["ejercicios_respiracion", "registro_actividades"] },
  { tipo: "Cognitivo-Conductual", consumo: false, trend: "positivo", numeroSesiones: 20,
    obs: "Baja autoestima crónica con patrones relacionales dependientes.",
    hipotesis: "Baja autoestima crónica con rasgos de dependencia relacional.",
    diagnostico: "Problemas relacionales crónicos con baja autoestima.",
    objetivo: "Fortalecer la autoestima. Identificar y cambiar patrones relacionales disfuncionales.",
    plan: "Trabajo en esquemas de vida, entrenamiento en asertividad, trabajo en límites, autocuidado.",
    tareasTexto: "Una actividad de autocuidado por día. Practicar decir 'no' en situaciones de bajo riesgo.",
    tareasList: ["registro_actividades", "ejercicios_gratitud", "Diario emocional"] },
  { tipo: "Entrevista Motivacional + TCC", consumo: true, trend: "dificil", numeroSesiones: 24,
    obs: "Dependencia alcohólica con historial de recaídas. Alta ambivalencia inicial al cambio.",
    hipotesis: "Dependencia alcohólica con patrón de recaída-recuperación.",
    diagnostico: "Dependencia al alcohol (CIE-11 6C40.2).",
    objetivo: "Alcanzar y mantener la sobriedad. Construir red de apoyo. Prevenir recaídas.",
    plan: "Entrevista motivacional, psicoeducación sobre adicción, plan de prevención de recaídas.",
    tareasTexto: "Asistir a reuniones de apoyo. Llamar a la red de apoyo ante cravings. Ejercicio físico diario.",
    tareasList: ["registro_actividades"] },
  { tipo: "Entrevista Motivacional + TCC", consumo: true, trend: "mixto", numeroSesiones: 20,
    obs: "Dependencia a sustancias en estadio temprano de recuperación. Presión social significativa.",
    hipotesis: "Uso nocivo de sustancias con riesgo de dependencia.",
    diagnostico: "Uso perjudicial de sustancias (CIE-11 6C41).",
    objetivo: "Mantener la abstinencia. Construir red social libre de consumo. Gestión del estrés sin sustancias.",
    plan: "Entrevista motivacional, técnicas HALT, reconstrucción de red social.",
    tareasTexto: "Técnica HALT ante impulso de consumo. Actividades sociales libres de sustancias.",
    tareasList: ["registro_actividades", "ejercicios_respiracion"] },
  { tipo: "TCC adaptada a adolescentes", consumo: false, trend: "positivo", numeroSesiones: 16,
    obs: "Depresión reactiva a situación escolar persistente. Aislamiento social.",
    hipotesis: "Trastorno adaptativo con humor depresivo reactivo.",
    diagnostico: "Depresión reactiva en adolescente.",
    objetivo: "Reducir síntomas depresivos. Construir red de apoyo. Fortalecer autoestima.",
    plan: "Intervención en contexto escolar, entrenamiento en habilidades sociales, activación conductual.",
    tareasTexto: "Actividad social con compañero de confianza. Registro de cosas positivas del día.",
    tareasList: ["registro_actividades", "ejercicios_gratitud"] },
  { tipo: "TCC adaptada a adolescentes", consumo: false, trend: "positivo", numeroSesiones: 12,
    obs: "Ansiedad de evaluación con afectación del sueño y rendimiento.",
    hipotesis: "Ansiedad de rendimiento académico con tendencia al perfeccionismo.",
    diagnostico: "Ansiedad de evaluación con componente perfeccionista.",
    objetivo: "Reducir la ansiedad de evaluación. Mejorar la tolerancia al error.",
    plan: "Psicoeducación sobre ansiedad, técnicas de respiración, reestructuración cognitiva.",
    tareasTexto: "Respiración 4-7-8 antes de exámenes. Registro de pensamientos catastróficos.",
    tareasList: ["ejercicios_respiracion", "registro_actividades"] },
  { tipo: "Terapia de Aceptación y Compromiso (ACT)", consumo: false, trend: "positivo", numeroSesiones: 16,
    obs: "Crisis de identidad vocacional. Baja motivación.",
    hipotesis: "Trastorno adaptativo con exploración de identidad en adulto joven.",
    diagnostico: "Trastorno de ajuste con humor depresivo.",
    objetivo: "Clarificar valores y metas. Reducir la comparación social. Desarrollar un plan de vida.",
    plan: "Clarificación de valores, defusión cognitiva, activación comprometida, exploración vocacional.",
    tareasTexto: "Ejercicio de clarificación de valores. Diario de progreso.",
    tareasList: ["registro_actividades", "ejercicios_gratitud"] },
  { tipo: "Cognitivo-Conductual", consumo: false, trend: "mixto", numeroSesiones: 12,
    obs: "Insomnio crónico con rumiación nocturna y fatiga diurna significativa.",
    hipotesis: "Insomnio de mantenimiento asociado a ansiedad generalizada leve.",
    diagnostico: "Trastorno de insomnio crónico.",
    objetivo: "Normalizar el ciclo de sueño. Reducir la rumiación nocturna.",
    plan: "Higiene del sueño, control de estímulos, restricción del tiempo en cama, reestructuración cognitiva.",
    tareasTexto: "Horario de sueño fijo. Diario de sueño. Sin pantallas una hora antes de dormir.",
    tareasList: ["higiene_sueno", "registro_actividades"] },
  { tipo: "Terapia Cognitivo-Conductual", consumo: false, trend: "dificil", numeroSesiones: 20,
    obs: "Dolor crónico con componente de catastrofización y afectación del ánimo.",
    hipotesis: "Trastorno de dolor crónico con componente psicológico significativo.",
    diagnostico: "Síndrome de dolor crónico con afectación anímica.",
    objetivo: "Reducir la catastrofización del dolor. Mejorar el funcionamiento diario a pesar del dolor.",
    plan: "Psicoeducación sobre dolor crónico, técnicas de aceptación, activación conductual gradual.",
    tareasTexto: "Registro de dolor y funcionamiento diario. Actividad física gradual según tolerancia.",
    tareasList: ["registro_actividades", "Diario emocional"] },
  { tipo: "Terapia de Pareja", consumo: false, trend: "mixto", numeroSesiones: 16,
    obs: "Conflicto de pareja recurrente con distanciamiento emocional progresivo.",
    hipotesis: "Patrón de comunicación disfuncional con escalada crítica-defensiva.",
    diagnostico: "Problemática relacional de pareja.",
    objetivo: "Mejorar la comunicación de pareja. Reducir la escalada de conflictos.",
    plan: "Mapeo de ciclo de conflicto, entrenamiento en comunicación no violenta, tiempo de calidad estructurado.",
    tareasTexto: "Tiempo de pareja semanal sin distracciones. Registro de momentos positivos.",
    tareasList: ["registro_actividades", "ejercicios_gratitud"] },
  { tipo: "Terapia Cognitivo-Conductual", consumo: false, trend: "mixto", numeroSesiones: 12,
    obs: "Ansiedad por adaptación tras cambio de ciudad reciente. Red social reducida.",
    hipotesis: "Trastorno adaptativo con ansiedad por cambio de contexto vital.",
    diagnostico: "Trastorno de adaptación con ansiedad.",
    objetivo: "Facilitar la adaptación al nuevo contexto. Construir red social.",
    plan: "Psicoeducación sobre adaptación, exposición social gradual, activación conductual.",
    tareasTexto: "Una actividad social nueva por semana. Registro de avances de adaptación.",
    tareasList: ["registro_actividades", "ejercicios_respiracion"] },
  { tipo: "Terapia Breve Centrada en Soluciones", consumo: false, trend: "positivo", numeroSesiones: 12,
    obs: "Síndrome de nido vacío tras independización de los hijos. Sensación de vacío existencial.",
    hipotesis: "Ajuste vital por cambio de rol familiar.",
    diagnostico: "Trastorno adaptativo por síndrome de nido vacío.",
    objetivo: "Redefinir identidad y propósito personal. Fortalecer vínculo de pareja.",
    plan: "Exploración de intereses propios, trabajo de pareja, clarificación de valores.",
    tareasTexto: "Retomar una actividad personal abandonada. Tiempo de calidad en pareja.",
    tareasList: ["registro_actividades", "ejercicios_gratitud"] },
];

// ══════════════════════════════════════════════════════════
// PLANTILLAS GENÉRICAS DE NOTAS DE SESIÓN (con {nombre})
// ══════════════════════════════════════════════════════════
const NOTES_EARLY = [
  { base: "Primeras sesiones. {nombre} presenta buena disposición y colaboración con el proceso.", reco: "Practicar las técnicas revisadas en sesión durante la semana.", obj: "Profundizar en la historia clínica y establecer objetivos concretos." },
  { base: "{nombre} reporta síntomas consistentes con la evaluación inicial. Buena alianza terapéutica.", reco: "Iniciar registro diario de síntomas y situaciones relevantes.", obj: "Introducir las primeras técnicas del plan de tratamiento." },
  { base: "Sesión de psicoeducación. {nombre} comprende el modelo explicativo de su proceso.", reco: "Leer el material psicoeducativo entregado.", obj: "Comenzar con las primeras tareas conductuales." },
];
const NOTES_MID = [
  { base: "{nombre} reporta avances moderados respecto a la semana anterior.", reco: "Continuar con la práctica de las técnicas aprendidas.", obj: "Reforzar la técnica trabajada e introducir un nuevo componente." },
  { base: "Progreso sostenido. {nombre} aplica las herramientas en situaciones cotidianas.", reco: "Registrar situaciones difíciles y la técnica utilizada.", obj: "Ampliar la aplicación de las técnicas a contextos más desafiantes." },
  { base: "{nombre} presenta una semana con altibajos, pero mantiene el compromiso con el proceso.", reco: "Mantener las rutinas de autocuidado establecidas.", obj: "Revisar obstáculos para la práctica y ajustar el plan si es necesario." },
  { base: "Sesión colaborativa. {nombre} identifica patrones propios con mayor claridad.", reco: "Continuar el registro y compartir hallazgos en la próxima sesión.", obj: "Trabajar sobre los patrones identificados." },
];
const NOTES_LATE_ONGOING = [
  { base: "{nombre} consolida los avances alcanzados durante el proceso. Buen funcionamiento general.", reco: "Mantener las rutinas y herramientas adquiridas como hábito.", obj: "Evaluar el espaciado de sesiones en las próximas semanas." },
  { base: "Sesión activa de seguimiento. {nombre} mantiene la estabilidad lograda.", reco: "Continuar aplicando las técnicas de forma autónoma.", obj: "Monitorear señales tempranas de posibles retrocesos." },
  { base: "{nombre} reporta funcionamiento estable en las áreas trabajadas.", reco: "Mantener el plan de autocuidado vigente.", obj: "Reforzar la prevención de recaídas." },
];
const NOTES_CLOSING_SUCCESS = [
  { base: "Sesión de cierre. {nombre} presenta remisión de los síntomas y buen funcionamiento general.", reco: "Consultar ante la reaparición significativa de síntomas.", obj: "Formalizar el alta terapéutica." },
  { base: "Alta terapéutica. {nombre} demuestra herramientas consolidadas y autonomía en su proceso.", reco: "Mantener los hábitos y rutinas construidos durante el tratamiento.", obj: "Cierre formal del proceso terapéutico." },
];
const NOTES_CLOSING_ABANDON = [
  { base: "{nombre} no se presentó a la sesión programada. Se intentó contacto sin respuesta.", reco: "Reagendar apenas exista respuesta del paciente.", obj: "Evaluar continuidad del proceso terapéutico." },
  { base: "Última sesión asistida por {nombre}. Se reportaron dificultades para mantener la asistencia regular.", reco: "Contacto de seguimiento para evaluar interés en continuar.", obj: "Valorar reingreso al proceso si el paciente retoma contacto." },
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// ══════════════════════════════════════════════════════════
// PLANTILLAS DE DIARIO EMOCIONAL (con {nombre})
// ══════════════════════════════════════════════════════════
interface DiaryTemplate {
  emocion: string;
  texto: string;
  sentimiento: "esperanzador" | "desafiante" | "equilibrado";
}
const DIARY_POSITIVO: DiaryTemplate[] = [
  { emocion: "Feliz", texto: "Hoy me sentí con energía. Pude hacer las cosas que tenía planeadas sin que la ansiedad me detuviera.", sentimiento: "esperanzador" },
  { emocion: "Tranquilo", texto: "Día tranquilo. Practiqué la respiración por la mañana y me ayudó a mantenerme centrado/a.", sentimiento: "esperanzador" },
  { emocion: "Motivado", texto: "Me sentí motivado/a a seguir con mis rutinas. Empiezo a notar el progreso.", sentimiento: "esperanzador" },
  { emocion: "Agradecido", texto: "Reconozco lo lejos que he llegado en este proceso. Me siento agradecido/a por el apoyo recibido.", sentimiento: "esperanzador" },
  { emocion: "Feliz", texto: "Compartí un buen momento con mi familia hoy. Hace tiempo no me sentía así.", sentimiento: "esperanzador" },
  { emocion: "Tranquilo", texto: "Logré manejar una situación estresante sin que se me saliera de las manos.", sentimiento: "esperanzador" },
];
const DIARY_MIXTO: DiaryTemplate[] = [
  { emocion: "Ansioso", texto: "Tuve un pico de ansiedad en la mañana, pero logré aplicar la técnica y bajó bastante.", sentimiento: "equilibrado" },
  { emocion: "Neutral", texto: "Día normal, sin grandes cambios. Cumplí con mis actividades habituales.", sentimiento: "equilibrado" },
  { emocion: "Estresado", texto: "El trabajo estuvo pesado hoy, pero pude tomar una pausa antes de que se acumulara demasiado.", sentimiento: "equilibrado" },
  { emocion: "Tranquilo", texto: "Empezó difícil el día pero terminó bien. Aprendí a no anticipar tanto lo negativo.", sentimiento: "equilibrado" },
  { emocion: "Molesto", texto: "Tuve un conflicto pequeño que me afectó el ánimo, pero no escaló como antes.", sentimiento: "equilibrado" },
  { emocion: "Feliz", texto: "Un buen momento en medio de una semana complicada. Lo anoto para no olvidarlo.", sentimiento: "equilibrado" },
];
const DIARY_DIFICIL: DiaryTemplate[] = [
  { emocion: "Triste", texto: "No fue un buen día. Me costó levantarme y mantener la motivación.", sentimiento: "desafiante" },
  { emocion: "Ansioso", texto: "La ansiedad estuvo presente casi todo el día. Intenté las técnicas pero no fueron suficientes.", sentimiento: "desafiante" },
  { emocion: "Estresado", texto: "Demasiadas cosas encima hoy. Sentí que no podía con todo.", sentimiento: "desafiante" },
  { emocion: "Molesto", texto: "Reaccioné mal ante una situación menor. Sé que necesito trabajar más en esto.", sentimiento: "desafiante" },
  { emocion: "Triste", texto: "Pensé mucho en lo mismo de siempre. Cuesta salir del ciclo algunos días.", sentimiento: "desafiante" },
];
const TREND_POOLS: Record<Archetype["trend"], DiaryTemplate[]> = {
  positivo: DIARY_POSITIVO, mixto: DIARY_MIXTO, dificil: DIARY_DIFICIL,
};

function scoresFor(sentimiento: DiaryTemplate["sentimiento"]) {
  if (sentimiento === "esperanzador") return { pos: 0.62, neg: 0.1, neu: 0.28, conf: 0.88 };
  if (sentimiento === "desafiante") return { pos: 0.12, neg: 0.6, neu: 0.28, conf: 0.85 };
  return { pos: 0.35, neg: 0.32, neu: 0.33, conf: 0.8 };
}

// ══════════════════════════════════════════════════════════
// PLANTILLAS DE TAREAS TERAPÉUTICAS POR TIPO
// ══════════════════════════════════════════════════════════
const TAREA_TEMPLATES: Record<TipoTarea, { actividades: string[]; veces: number; tiempo: number }[]> = {
  ejercicios_respiracion: [
    { actividades: ["Respiración 4-7-8 preventiva", "Respiración antes de dormir"], veces: 6, tiempo: 900 },
    { actividades: ["Respiración diafragmática diaria"], veces: 7, tiempo: 700 },
    { actividades: ["Técnica de respiración ante situación difícil"], veces: 5, tiempo: 600 },
  ],
  registro_actividades: [
    { actividades: ["Actividad placentera del día", "Salida social"], veces: 5, tiempo: 0 },
    { actividades: ["Ejercicio físico", "Actividad con familia"], veces: 6, tiempo: 0 },
    { actividades: ["Cumplimiento de rutina semanal"], veces: 7, tiempo: 0 },
  ],
  higiene_sueno: [
    { actividades: ["Horario de sueño fijo", "Sin pantallas antes de dormir"], veces: 6, tiempo: 0 },
    { actividades: ["Rutina relajante nocturna"], veces: 7, tiempo: 0 },
  ],
  ejercicios_gratitud: [
    { actividades: ["Tres cosas positivas del día"], veces: 6, tiempo: 400 },
    { actividades: ["Carta de agradecimiento", "Reconocimiento de logros"], veces: 5, tiempo: 500 },
  ],
};

// ══════════════════════════════════════════════════════════
// PACIENTES NUEVOS
// ══════════════════════════════════════════════════════════
interface NewPatientDef {
  nombres: string; apellidos: string; ci: string; fecha_nacimiento: string;
  sexo: string; escolaridad: string; ocupacion: string; estado_civil: string;
  telefono: string; direccion: string; contacto_emergencia: string;
  userName: string;
}
const NEW_PATIENTS: NewPatientDef[] = [
  { nombres: "Gabriela", apellidos: "Soliz Fernández", ci: "5003017", fecha_nacimiento: "1996-02-10", sexo: "Femenino", escolaridad: "Universitaria", ocupacion: "Contadora", estado_civil: "Soltera", telefono: "+591 70020001", direccion: "Zona Central", contacto_emergencia: "Madre - 70020101", userName: "gsoliz" },
  { nombres: "Javier", apellidos: "Quiroga Ramos", ci: "5003018", fecha_nacimiento: "1988-06-22", sexo: "Masculino", escolaridad: "Universitaria", ocupacion: "Profesor", estado_civil: "Casado", telefono: "+591 70020002", direccion: "Zona Norte", contacto_emergencia: "Esposa - 70020102", userName: "jquiroga" },
  { nombres: "Camila", apellidos: "Rojas Aponte", ci: "5003019", fecha_nacimiento: "1999-09-14", sexo: "Femenino", escolaridad: "Universitaria", ocupacion: "Estudiante", estado_civil: "Soltera", telefono: "+591 70020003", direccion: "Zona Sur", contacto_emergencia: "Padre - 70020103", userName: "crojas" },
  { nombres: "Sebastián", apellidos: "Choque Villca", ci: "5003020", fecha_nacimiento: "1993-12-01", sexo: "Masculino", escolaridad: "Universitaria", ocupacion: "Ingeniero civil", estado_civil: "Soltero", telefono: "+591 70020004", direccion: "Zona Este", contacto_emergencia: "Hermano - 70020104", userName: "schoque" },
  { nombres: "Fernanda", apellidos: "Guzmán Peña", ci: "5003021", fecha_nacimiento: "1985-03-19", sexo: "Femenino", escolaridad: "Universitaria", ocupacion: "Arquitecta", estado_civil: "Divorciada", telefono: "+591 70020005", direccion: "Zona Central", contacto_emergencia: "Amiga - 70020105", userName: "fguzman" },
  { nombres: "Mateo", apellidos: "Salazar Cuellar", ci: "5003022", fecha_nacimiento: "1991-07-08", sexo: "Masculino", escolaridad: "Universitaria", ocupacion: "Comerciante", estado_civil: "Casado", telefono: "+591 70020006", direccion: "Zona Norte", contacto_emergencia: "Esposa - 70020106", userName: "msalazar" },
  { nombres: "Ximena", apellidos: "Poma Yucra", ci: "5003023", fecha_nacimiento: "2000-01-27", sexo: "Femenino", escolaridad: "Universitaria", ocupacion: "Estudiante", estado_civil: "Soltera", telefono: "+591 70020007", direccion: "Zona Sur", contacto_emergencia: "Madre - 70020107", userName: "xpoma" },
  { nombres: "Álvaro", apellidos: "Rivera Sánchez", ci: "5003024", fecha_nacimiento: "1979-11-05", sexo: "Masculino", escolaridad: "Secundaria", ocupacion: "Chofer", estado_civil: "Casado", telefono: "+591 70020008", direccion: "Zona Este", contacto_emergencia: "Esposa - 70020108", userName: "arivera" },
  { nombres: "Renata", apellidos: "Cáceres López", ci: "5003025", fecha_nacimiento: "1997-05-30", sexo: "Femenino", escolaridad: "Universitaria", ocupacion: "Diseñadora", estado_civil: "Soltera", telefono: "+591 70020009", direccion: "Zona Central", contacto_emergencia: "Padre - 70020109", userName: "rcaceres" },
  { nombres: "Bruno", apellidos: "Escobar Mendoza", ci: "5003026", fecha_nacimiento: "1990-08-16", sexo: "Masculino", escolaridad: "Universitaria", ocupacion: "Contador", estado_civil: "Soltero", telefono: "+591 70020010", direccion: "Zona Norte", contacto_emergencia: "Madre - 70020110", userName: "bescobar" },
  { nombres: "Paola", apellidos: "Vargas Choque", ci: "5003027", fecha_nacimiento: "1983-04-23", sexo: "Femenino", escolaridad: "Universitaria", ocupacion: "Enfermera", estado_civil: "Casada", telefono: "+591 70020011", direccion: "Zona Sur", contacto_emergencia: "Esposo - 70020111", userName: "pvargas" },
  { nombres: "Emilio", apellidos: "Condori Huanca", ci: "5003028", fecha_nacimiento: "2008-10-12", sexo: "Masculino", escolaridad: "Secundaria", ocupacion: "Estudiante", estado_civil: "Soltero", telefono: "+591 70020012", direccion: "Zona Este", contacto_emergencia: "Madre - 70020112", userName: "econdori" },
  { nombres: "Milagros", apellidos: "Apaza Colque", ci: "5003029", fecha_nacimiento: "2010-02-04", sexo: "Femenino", escolaridad: "Secundaria", ocupacion: "Estudiante", estado_civil: "Soltera", telefono: "+591 70020013", direccion: "Zona Central", contacto_emergencia: "Padre - 70020113", userName: "mapaza" },
  { nombres: "Sergio", apellidos: "Blanco Terrazas", ci: "5003030", fecha_nacimiento: "1994-06-18", sexo: "Masculino", escolaridad: "Universitaria", ocupacion: "Músico", estado_civil: "Soltero", telefono: "+591 70020014", direccion: "Zona Norte", contacto_emergencia: "Hermana - 70020114", userName: "sblanco" },
];

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
async function main() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  try {
    await qr.startTransaction();

    // ── 0. Referencias existentes ────────────────────────
    const psicologos: { id: string; nombres: string }[] = await qr.query(
      `SELECT id, nombres FROM psicologos ORDER BY fecha_creacion ASC`
    );
    if (psicologos.length === 0) throw new Error("No hay psicólogos en la base — abortando.");

    const pacientesExistentes: { id: string; nombres: string; apellidos: string; psicologo_id: string | null }[] =
      await qr.query(`SELECT id, nombres, apellidos, psicologo_id FROM pacientes ORDER BY fecha_ingreso ASC`);

    const [rolPaciente] = await qr.query(`SELECT id FROM roles WHERE name = 'paciente' LIMIT 1`);
    if (!rolPaciente) throw new Error("No existe el rol 'paciente' — abortando.");

    // El psicólogo del admin (si existe, ver seedAdminPsicologo.ts) no debe
    // completarse hasta TARGET_PER_PSICOLOGO con pacientes nuevos — se le
    // asignó deliberadamente una cantidad fija (2 activos, 2 inactivos).
    const [adminPsicologo] = await qr.query(
      `SELECT p.id FROM psicologos p
       JOIN usuarios u ON u.id = p.usuario_id
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'admin'
       LIMIT 1`
    );
    const adminPsicologoId: string | null = adminPsicologo?.id ?? null;

    const consultorios: { id: string }[] = await qr.query(`SELECT id FROM consultorios`);
    if (consultorios.length === 0) throw new Error("No hay consultorios en la base — abortando.");
    const CONS_IDS = consultorios.map((c) => c.id);

    console.log(`  ℹ ${psicologos.length} psicólogos, ${pacientesExistentes.length} pacientes existentes, ${consultorios.length} consultorios`);

    // ── 1. Decidir de una sola vez, para CADA paciente (existente o nuevo),
    //      su psicólogo, posición local (para día/hora), archetype y estado.
    //      Este orden es el único que se usa después — tanto para crear el
    //      usuario/contraseña (si le toca) como para generar la data clínica —
    //      evitando cualquier desincronización entre ambos pasos.
    type PatientProfile = {
      id: string; nombres: string; psicologoId: string; localIdx: number;
      archetype: Archetype; estado: "activo" | "concluido" | "abandonado";
      isNew: boolean; newDef?: NewPatientDef;
    };

    const TARGET_PER_PSICOLOGO = 6;
    const grouped: PatientProfile[] = [];
    let archIdx = 0;
    let newIdx = 0;

    function nextArchetypeAndEstado() {
      const archetype = ARCHETYPES[archIdx % ARCHETYPES.length];
      const cycle = archIdx % 6; // 4/6 activo, 1/6 concluido, 1/6 abandonado
      const estado: "activo" | "concluido" | "abandonado" =
        cycle === 2 ? "concluido" : cycle === 4 ? "abandonado" : "activo";
      archIdx++;
      return { archetype, estado };
    }

    for (const psi of psicologos) {
      const existentesDePsi = pacientesExistentes.filter((p) => p.psicologo_id === psi.id);
      let localIdx = 0;
      for (const ex of existentesDePsi) {
        const { archetype, estado } = nextArchetypeAndEstado();
        grouped.push({ id: ex.id, nombres: ex.nombres, psicologoId: psi.id, localIdx, archetype, estado, isNew: false });
        localIdx++;
      }
      const faltan = Math.max(0, TARGET_PER_PSICOLOGO - existentesDePsi.length);
      for (let k = 0; k < faltan && newIdx < NEW_PATIENTS.length; k++, newIdx++) {
        const { archetype, estado } = nextArchetypeAndEstado();
        grouped.push({
          id: "", nombres: NEW_PATIENTS[newIdx].nombres, psicologoId: psi.id, localIdx, archetype, estado,
          isNew: true, newDef: NEW_PATIENTS[newIdx],
        });
        localIdx++;
      }
    }

    // ── 2. Insertar pacientes nuevos (+ usuario si su archetype trae tareas) ─
    const SALT = 10;
    const defaultPacientePasswordHash = await bcrypt.hash("Paciente-2026!", SALT);

    let creados = 0;
    let conUsuario = 0;
    for (const p of grouped) {
      if (!p.isNew) continue;
      const def = p.newDef!;
      const pacId = randomUUID();
      const tendraTareas = p.archetype.tareasList.length > 0;

      let usuarioId: string | null = null;
      if (tendraTareas) {
        usuarioId = randomUUID();
        await qr.query(
          `INSERT INTO usuarios (id, user_name, password_hash, role_id, debe_cambiar_password) VALUES ($1,$2,$3,$4,true)`,
          [usuarioId, def.userName, defaultPacientePasswordHash, rolPaciente.id]
        );
        conUsuario++;
      }

      await qr.query(
        `INSERT INTO pacientes
           (id, usuario_id, psicologo_id, nombres, apellidos, ci, fecha_nacimiento, sexo,
            escolaridad, ocupacion, estado_civil, telefono, contacto_emergencia, direccion, activo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)`,
        [pacId, usuarioId, p.psicologoId, def.nombres, def.apellidos, def.ci, def.fecha_nacimiento, def.sexo,
          def.escolaridad, def.ocupacion, def.estado_civil, def.telefono, def.contacto_emergencia, def.direccion]
      );

      p.id = pacId;
      creados++;
    }
    console.log(`  ✓ ${creados} pacientes nuevos creados (${conUsuario} con usuario/contraseña)`);
    console.log(`  ℹ Total de pacientes a procesar: ${grouped.length}`);

    // ── 3. Limpiar TODA la data clínica ──────────────────
    await qr.query(`DELETE FROM analisis_sentimiento`);
    await qr.query(`DELETE FROM diario_emocional`);
    await qr.query(`DELETE FROM registro_tareas_terapeuticas`);
    await qr.query(`DELETE FROM historial_sesion`);
    await qr.query(`DELETE FROM historial_tratamiento`);
    await qr.query(`DELETE FROM antecedentes_paciente`);
    await qr.query(`DELETE FROM citas`);
    console.log("  ✓ Data clínica anterior eliminada (antecedentes, tratamientos, sesiones, citas, diario, análisis, tareas)");

    // ── 4. Generar data clínica para cada paciente ───────
    let antecedentesCount = 0, tratamientoCount = 0, sesionCount = 0, citaCount = 0, diarioCount = 0, tareaCount = 0;

    for (const pac of grouped) {
      {
        const psicoId = pac.psicologoId;
        const localIdx = pac.localIdx;
        const archetype = pac.archetype;
        const estado = pac.estado;

        // ── Antecedentes ──
        await qr.query(
          `INSERT INTO antecedentes_paciente (id, paciente_id, personales, familiares, medicos_psiquiatricos)
           VALUES ($1,$2,$3,$4,$5)`,
          [randomUUID(), pac.id,
            enc("Sin tratamiento psicológico previo relevante."),
            enc("Sin antecedentes familiares de salud mental relevantes reportados."),
            enc("Sin diagnósticos psiquiátricos previos. Sin medicación psiquiátrica activa.")]
        );
        antecedentesCount++;

        // ── Tratamiento ──
        const fechaInicio = START;
        let fechaCierre: string | null = null;
        if (estado === "concluido") fechaCierre = addDays(fechaInicio, 10 * 7);
        if (estado === "abandonado") fechaCierre = addDays(fechaInicio, 6 * 7);
        if (fechaCierre && fechaCierre > TODAY) fechaCierre = TODAY;

        const trId = randomUUID();
        await qr.query(
          `INSERT INTO historial_tratamiento
             (id, "pacienteId", "psicologoId", tipo_intervencion, numero_sesiones_tentativas,
              observaciones_clinicas_encrypted, hipotesis_diagnostica_encrypted,
              diagnostico_clinico_encrypted, objetivo_general_encrypted, plan_trabajo_encrypted,
              consumo_sustancias, tareas_terapeuticas, tareas_terapeuticas_list,
              fecha_inicio, fecha_cierre, comentarios_finales_encrypted, activo)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [trId, pac.id, psicoId, archetype.tipo, archetype.numeroSesiones,
            enc(archetype.obs), enc(archetype.hipotesis), enc(archetype.diagnostico),
            enc(archetype.objetivo), enc(archetype.plan),
            archetype.consumo, archetype.tareasTexto, JSON.stringify(archetype.tareasList),
            fechaInicio, fechaCierre,
            estado === "concluido" ? enc("Tratamiento concluido satisfactoriamente. Paciente alcanzó los objetivos terapéuticos planteados.")
              : estado === "abandonado" ? enc("Paciente discontinuó la asistencia sin previo aviso. Se intentó contacto de seguimiento sin respuesta.")
              : null,
            estado !== "activo" ? false : true]
        );
        tratamientoCount++;

        // ── Citas + Sesiones (semanal, día fijo según localIdx) ──
        const targetDow = localIdx % 5; // 0=Lunes..4=Viernes
        const rangoFin = fechaCierre ?? END;
        const fechas = weeklyDates(fechaInicio, rangoFin, targetDow);

        for (let s = 0; s < fechas.length; s++) {
          const fecha = fechas[s];
          const slot = findSlot(fecha, psicoId, CONS_IDS);
          if (!slot) { console.warn(`    ⚠ Sin slot disponible para ${fecha} (psicólogo ${psicoId})`); continue; }

          const esFutura = fecha > TODAY;
          const citaEstado = esFutura ? "activa" : "finalizada";

          await qr.query(
            `INSERT INTO citas
               (id, "pacienteId", "psicologoId", "consultorioId",
                fecha_sesion, hora_sesion, duracion_minutos, tipo_cita,
                estado, solicitada_por, fecha_confirmacion)
             VALUES ($1,$2,$3,$4,$5,$6,60,'Presencial',$7,'psicologo',
                     CASE WHEN $7='finalizada' THEN now() ELSE NULL END)`,
            [randomUUID(), pac.id, psicoId, slot.consId, fecha, slot.hora, citaEstado]
          );
          citaCount++;

          if (!esFutura) {
            const isLastPast = s === fechas.filter((f) => f <= TODAY).length - 1;
            const isClosingSession = isLastPast && estado !== "activo";
            let notes;
            if (isClosingSession) {
              notes = estado === "concluido" ? pick(NOTES_CLOSING_SUCCESS, s) : pick(NOTES_CLOSING_ABANDON, s);
            } else if (s < 3) {
              notes = pick(NOTES_EARLY, s);
            } else if (isLastPast) {
              notes = pick(NOTES_LATE_ONGOING, s);
            } else {
              notes = pick(NOTES_MID, s);
            }
            const nextFecha = s < fechas.length - 1 ? fechas[s + 1] : null;
            await qr.query(
              `INSERT INTO historial_sesion
                 (id, "tratamientoId", fecha_sesion, fecha_proxima_sesion,
                  seguimiento_encrypted, recomendaciones_encrypted,
                  objetivos_proxima_sesion_encrypted, finalizada, fecha_finalizacion)
               VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)`,
              [randomUUID(), trId, fecha, isClosingSession ? null : nextFecha,
                enc(notes.base.replace("{nombre}", pac.nombres)),
                enc(notes.reco),
                enc(notes.obj),
                `${fecha}T18:00:00`]
            );
            sesionCount++;
          }
        }

        // ── Diario emocional + análisis (si tiene esa tarea) ──
        if (archetype.tareasList.includes("Diario emocional")) {
          const pool = TREND_POOLS[archetype.trend];
          const diarioFin = fechaCierre ?? TODAY;
          let d = fechaInicio, dIdx = 0;
          while (d <= diarioFin) {
            // ~5 de cada 7 días (casi diario, no todos los días)
            const skip = dIdx % 7 === 3 || dIdx % 7 === 6;
            if (!skip) {
              const tpl = pick(pool, dIdx);
              const diarioId = randomUUID();
              await qr.query(
                `INSERT INTO diario_emocional (id, paciente_id, fecha_entrada, emocion_seleccionada, texto_entrada, estado_analisis, created_at)
                 VALUES ($1,$2,$3,$4,$5,'analizado',$6)`,
                [diarioId, pac.id, d, tpl.emocion, tpl.texto, `${d}T20:00:00`]
              );
              const sc = scoresFor(tpl.sentimiento);
              await qr.query(
                `INSERT INTO analisis_sentimiento
                   (id, diario_emocional_id, paciente_id, fecha_analisis, sentimiento_general,
                    confianza, score_positivo, score_negativo, score_neutral, emocion_predominante,
                    palabras_clave, alertas, modelo_usado)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
                [randomUUID(), diarioId, pac.id, d, tpl.sentimiento,
                  sc.conf, sc.pos, sc.neg, sc.neu, tpl.emocion,
                  JSON.stringify([{ word: tpl.emocion.toLowerCase(), frequency: 2 }]),
                  JSON.stringify(tpl.sentimiento === "desafiante" ? [{ type: "info", text: "Seguimiento sugerido por el psicólogo." }] : []),
                  "pysentimiento/robertuito-sentiment-analysis"]
              );
              diarioCount++;
            }
            d = addDays(d, 1);
            dIdx++;
          }
        }

        // ── Registro de tareas terapéuticas (quincenal) ──
        const tiposTarea = archetype.tareasList.filter((t): t is TipoTarea =>
          ["registro_actividades", "ejercicios_gratitud", "higiene_sueno", "ejercicios_respiracion"].includes(t)
        );
        if (tiposTarea.length > 0) {
          const tareaFin = fechaCierre ?? TODAY;
          let t = addDays(fechaInicio, 7), tIdx = 0;
          while (t <= tareaFin) {
            const tipo = tiposTarea[tIdx % tiposTarea.length];
            const tpl = pick(TAREA_TEMPLATES[tipo], tIdx);
            await qr.query(
              `INSERT INTO registro_tareas_terapeuticas
                 (id, paciente_id, tipo_tarea, fecha, actividades_realizadas, veces_completado, tiempo_total_segundos, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
              [randomUUID(), pac.id, tipo, t, tpl.actividades.join(","), tpl.veces, tpl.tiempo, `${t}T21:00:00`]
            );
            tareaCount++;
            t = addDays(t, 14);
            tIdx++;
          }
        }

      }
    }

    await qr.commitTransaction();

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║       ✅  SEED V3 COMPLETADO EXITOSAMENTE             ║");
    console.log("╠═══════════════════════════════════════════════════════╣");
    console.log(`║  Periodo: ${START} → ${END}                     ║`);
    console.log("╠═══════════════════════════════════════════════════════╣");
    console.log(`║  Pacientes totales procesados: ${grouped.length}                     ║`);
    console.log(`║  Antecedentes: ${antecedentesCount}                                       ║`);
    console.log(`║  Tratamientos: ${tratamientoCount}                                       ║`);
    console.log(`║  Sesiones: ${sesionCount}                                           ║`);
    console.log(`║  Citas: ${citaCount}                                              ║`);
    console.log(`║  Entradas de diario + análisis: ${diarioCount}                     ║`);
    console.log(`║  Registros de tareas terapéuticas: ${tareaCount}                  ║`);
    console.log("╚═══════════════════════════════════════════════════════╝\n");
  } catch (err) {
    await qr.rollbackTransaction();
    console.error("❌ Seed V3 fallido:", err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
