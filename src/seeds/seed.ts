/**
 * MDG Backend — Development Seed
 * Run: npm run seed
 *
 * Creates:
 *  - 6 users  (1 admin + 5 psicólogos)
 *  - 16 pacientes  (2-4 por psicólogo)
 *  - Entradas de diario semanal  Mar 4 → Apr 1 2026
 *  - Análisis de sentimiento coherentes con el texto
 *  - Tratamientos, sesiones, citas, antecedentes, tareas terapéuticas
 */

import "reflect-metadata";
import "dotenv/config";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { AppDataSource } from "../config/datasource";
import { encryptText, deriveKey } from "../utils/crypto.util";

// ── Encryption ────────────────────────────────────────────
const ENC_KEY = deriveKey(
  process.env.ENCRYPTION_SECRET ?? "default-dev-secret-change-in-production"
);
function enc(plain: string): string {
  return JSON.stringify(encryptText(plain, ENC_KEY));
}

// ── Fixed UUIDs ───────────────────────────────────────────
const R_ADMIN  = "aaaa0001-aa00-aa00-aa00-000000000001";
const R_PSICO  = "aaaa0001-aa00-aa00-aa00-000000000002";

const C1 = "bbbb0002-bb00-bb00-bb00-000000000001";
const C2 = "bbbb0002-bb00-bb00-bb00-000000000002";
const C3 = "bbbb0002-bb00-bb00-bb00-000000000003";

const U_ADMIN  = "cccc0003-cc00-cc00-cc00-000000000001";
const U_CMEND  = "cccc0003-cc00-cc00-cc00-000000000002";
const U_AFLOR  = "cccc0003-cc00-cc00-cc00-000000000003";
const U_RVARG  = "cccc0003-cc00-cc00-cc00-000000000004";
const U_MQUISP = "cccc0003-cc00-cc00-cc00-000000000005";
const U_JTORR  = "cccc0003-cc00-cc00-cc00-000000000006";

const PS_CMEND  = "dddd0004-dd00-dd00-dd00-000000000001";
const PS_AFLOR  = "dddd0004-dd00-dd00-dd00-000000000002";
const PS_RVARG  = "dddd0004-dd00-dd00-dd00-000000000003";
const PS_MQUISP = "dddd0004-dd00-dd00-dd00-000000000004";
const PS_JTORR  = "dddd0004-dd00-dd00-dd00-000000000005";

// Pacientes
const PA: Record<number,string> = {};
for (let i = 1; i <= 16; i++) PA[i] = `eeee0005-ee00-ee00-ee00-${String(i).padStart(12,"0")}`;

// Tratamientos
const TR: Record<number,string> = {};
for (let i = 1; i <= 16; i++) TR[i] = `ffff0006-ff00-ff00-ff00-${String(i).padStart(12,"0")}`;

// ── Types ─────────────────────────────────────────────────
interface Alerta { type: string; text: string; }
interface Keyword { word: string; frequency: number; }
interface DiarioEntry {
  fecha: string;
  emocion: string;
  texto: string;
  sentimiento: "esperanzador" | "desafiante" | "equilibrado";
  score_pos: number;
  score_neg: number;
  score_neu: number;
  confianza: number;
  emocion_predo: string;
  palabras: Keyword[];
  alertas: Alerta[];
}

// ── Diary helper ──────────────────────────────────────────
function kw(...words: string[]): Keyword[] {
  return words.map((w, i) => ({ word: w, frequency: 3 - Math.floor(i / 2) }));
}
const W = ["warning","critical","info"] as const;
function alerta(type: typeof W[number], text: string): Alerta { return { type, text }; }

// ══════════════════════════════════════════════════════════
// DIARY DATA PER PATIENT
// ══════════════════════════════════════════════════════════

// PA[1] – Luis Rodríguez – Ansiedad generalizada (MEJORANDO)
const diarios_pa1: DiarioEntry[] = [
  {
    fecha: "2026-03-04", emocion: "Ansioso",
    texto: "Hoy tuve otro ataque de pánico en la reunión de trabajo. No podía respirar, sentía que el corazón se me salía del pecho. Me tuve que salir corriendo. Estoy muy preocupado, la ansiedad me está controlando y no sé qué hacer. Siento que estoy perdiendo el control de mi vida.",
    sentimiento:"desafiante", score_pos:0.0891, score_neg:0.8234, score_neu:0.0875, confianza:0.8234,
    emocion_predo:"Ansioso",
    palabras: kw("ansiedad","pánico","preocupado","nervioso","control"),
    alertas:[alerta("warning","Se detectaron indicadores de estrés severo y ansiedad intensa. Se recomienda monitoreo cercano.")]
  },
  {
    fecha: "2026-03-11", emocion: "Preocupado",
    texto: "Sigo sintiéndome nervioso casi todo el tiempo, aunque hoy el ataque de pánico fue menos intenso. Practiqué la respiración que me enseñó el psicólogo y algo ayudó. Todavía me preocupa el trabajo, pero creo que estoy aprendiendo a manejar un poco mejor la situación. Es un proceso lento.",
    sentimiento:"desafiante", score_pos:0.1456, score_neg:0.6123, score_neu:0.2421, confianza:0.6123,
    emocion_predo:"Ansioso",
    palabras: kw("nervioso","ansiedad","respiración","aprendiendo","proceso"),
    alertas:[alerta("warning","Persisten síntomas de ansiedad. Continuar con las técnicas aprendidas.")]
  },
  {
    fecha: "2026-03-18", emocion: "Tranquilo",
    texto: "Esta semana fue considerablemente mejor. Solo tuve un momento de nerviosismo leve que pude controlar con la respiración. Dormí mejor también. Creo que estoy progresando, aunque todavía tengo días difíciles. Me siento más esperanzado que antes.",
    sentimiento:"equilibrado", score_pos:0.3456, score_neg:0.3234, score_neu:0.3310, confianza:0.3456,
    emocion_predo:"Tranquilo",
    palabras: kw("mejor","progresando","respiración","esperanzado","control"),
    alertas:[]
  },
  {
    fecha: "2026-03-25", emocion: "Contento",
    texto: "Gran semana para mí. Pude participar en todas las reuniones de trabajo sin tener ningún episodio de ansiedad. Me siento mucho más confiado y tranquilo. Las técnicas me están funcionando y el apoyo del psicólogo es invaluable. Creo que estoy en el camino correcto.",
    sentimiento:"esperanzador", score_pos:0.6789, score_neg:0.1234, score_neu:0.1977, confianza:0.6789,
    emocion_predo:"Motivado",
    palabras: kw("tranquilo","confiado","apoyo","progreso","mejor"),
    alertas:[]
  },
  {
    fecha: "2026-04-01", emocion: "Feliz",
    texto: "Me siento excelente. Esta fue la mejor semana desde que empecé el tratamiento. Fui a una reunión social que antes me habría causado un ataque de pánico y me sentí completamente tranquilo. Estoy muy agradecido por el trabajo que hemos hecho juntos. Me siento libre de la ansiedad por primera vez en mucho tiempo.",
    sentimiento:"esperanzador", score_pos:0.8234, score_neg:0.0567, score_neu:0.1199, confianza:0.8234,
    emocion_predo:"Agradecido",
    palabras: kw("excelente","tranquilo","agradecido","libre","progreso"),
    alertas:[]
  },
];

// PA[2] – Valentina Cárdenas – Depresión mayor (MEJORANDO LENTO)
const diarios_pa2: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Triste",
    texto:"No quiero salir de la cama. Todo parece sin sentido. No tengo energía para nada, ni siquiera para comer bien. Me siento completamente sola aunque esté rodeada de gente. La tristeza es tan pesada que me aplasta. No veo cómo puede mejorar esto.",
    sentimiento:"desafiante", score_pos:0.0345, score_neg:0.8567, score_neu:0.1088, confianza:0.8567,
    emocion_predo:"Triste",
    palabras:kw("tristeza","sola","sin_sentido","cansada","deprimida"),
    alertas:[alerta("warning","Se detectan síntomas depresivos severos. Se recomienda apoyo profesional continuo.")]
  },
  {
    fecha:"2026-03-11", emocion:"Triste",
    texto:"Sigo sintiéndome muy baja. Fui a la sesión con el psicólogo y me ayudó un poco hablar. Pero al llegar a casa volvió la oscuridad. Intenté salir a caminar como me recomendó y caminé media hora, aunque no tenía ganas. Me siento atrapada en esta tristeza.",
    sentimiento:"desafiante", score_pos:0.0892, score_neg:0.7234, score_neu:0.1874, confianza:0.7234,
    emocion_predo:"Triste",
    palabras:kw("triste","oscuridad","atrapada","tristeza","ayudó"),
    alertas:[alerta("info","La paciente muestra síntomas persistentes de tristeza. Mantener seguimiento cercano.")]
  },
  {
    fecha:"2026-03-18", emocion:"Neutral",
    texto:"Hubo días mejores esta semana. El miércoles pude reunirme con una amiga y reímos un rato. Todavía me siento pesada la mayor parte del tiempo, pero ese momento de alegría me recordó que todavía puedo sentir cosas buenas. El psicólogo dice que esto es un signo de mejoría.",
    sentimiento:"equilibrado", score_pos:0.2789, score_neg:0.4123, score_neu:0.3088, confianza:0.4123,
    emocion_predo:"Tranquilo",
    palabras:kw("mejoría","amiga","alegría","mejor","días"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Tranquilo",
    texto:"Esta semana logré ir al trabajo todos los días por primera vez en meses. Hubo momentos difíciles pero también momentos donde me sentí normal. Estoy empezando a ver la luz al final del túnel. La terapia está funcionando lentamente pero seguramente. Me siento un poco más yo misma.",
    sentimiento:"equilibrado", score_pos:0.3789, score_neg:0.3234, score_neu:0.2977, confianza:0.3789,
    emocion_predo:"Tranquilo",
    palabras:kw("trabajo","logré","mejorando","esperanza","progreso"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Contento",
    texto:"Hoy me desperté y me sentí bien por primera vez en mucho tiempo. No de forma exagerada, sino una calma tranquila y positiva. Llamé a mi mamá y tuvimos una conversación bonita. Creo que finalmente estoy saliendo de esto. Hay esperanza y me siento agradecida.",
    sentimiento:"esperanzador", score_pos:0.5678, score_neg:0.1567, score_neu:0.2755, confianza:0.5678,
    emocion_predo:"Agradecido",
    palabras:kw("bien","calma","esperanza","agradecida","progreso"),
    alertas:[]
  },
];

// PA[3] – Marco Herrera – Burnout laboral (ESTABLE)
const diarios_pa3: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Estresado",
    texto:"El trabajo me está consumiendo. Trabajé 14 horas hoy y aun así no terminé todo lo que tenía pendiente. Mi jefe estuvo presionándome toda la semana. Me siento agotado y sin energía. Mi familia dice que llego muy irritado a casa. Necesito un descanso pero no puedo parar.",
    sentimiento:"desafiante", score_pos:0.0789, score_neg:0.7123, score_neu:0.2088, confianza:0.7123,
    emocion_predo:"Estresado",
    palabras:kw("agotado","trabajo","presión","estrés","irritado"),
    alertas:[alerta("warning","Se detectan indicadores de burnout severo. Considerar establecimiento urgente de límites laborales.")]
  },
  {
    fecha:"2026-03-11", emocion:"Neutral",
    texto:"Tomé la decisión de salir más temprano del trabajo el jueves. Fue difícil pero lo hice. Pude cenar con mi familia y fue agradable. El viernes volvió el estrés, pero ese momento con mi familia me recordó por qué hago esto. Todavía muy estresado pero con pequeños momentos buenos.",
    sentimiento:"equilibrado", score_pos:0.2789, score_neg:0.4567, score_neu:0.2644, confianza:0.4567,
    emocion_predo:"Estresado",
    palabras:kw("estrés","trabajo","familia","agradable","cansado"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Frustrado",
    texto:"Esta semana fue particularmente intensa en el trabajo. Hubo una crisis con un cliente importante y tuve que trabajar el fin de semana. Me siento completamente agotado y resentido. Siento que el trabajo me roba tiempo con mi familia y eso me pesa mucho. No puedo seguir así.",
    sentimiento:"desafiante", score_pos:0.0567, score_neg:0.6789, score_neu:0.2644, confianza:0.6789,
    emocion_predo:"Estresado",
    palabras:kw("agotado","crisis","resentido","trabajo","estrés"),
    alertas:[alerta("warning","Síntomas de burnout persistentes. Evaluar situación laboral con urgencia.")]
  },
  {
    fecha:"2026-03-25", emocion:"Tranquilo",
    texto:"Hablé con mi jefe sobre la carga de trabajo y me escuchó. Me va a asignar un asistente temporalmente. Me siento un poco aliviado aunque escéptico de que cambie. También pude hacer ejercicio tres veces esta semana, que me ayudó mucho con el estrés. Estoy intentando establecer límites.",
    sentimiento:"equilibrado", score_pos:0.3234, score_neg:0.3567, score_neu:0.3199, confianza:0.3567,
    emocion_predo:"Tranquilo",
    palabras:kw("límites","aliviado","ejercicio","trabajo","escéptico"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Tranquilo",
    texto:"La semana fue más manejable gracias al asistente. Pude salir a tiempo todos los días. El ejercicio sigue ayudando. Todavía hay estrés, el trabajo siempre será demandante, pero creo que estoy aprendiendo a manejarlo mejor. Me siento más equilibrado que hace un mes.",
    sentimiento:"equilibrado", score_pos:0.3456, score_neg:0.2789, score_neu:0.3755, confianza:0.3755,
    emocion_predo:"Tranquilo",
    palabras:kw("equilibrado","manejable","ejercicio","mejor","límites"),
    alertas:[]
  },
];

// PA[4] – Sofía Aguilar – Ansiedad social (MEJORANDO)
const diarios_pa4: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Ansioso",
    texto:"Hoy tuve que hacer una exposición en la universidad y fue horrible. Me puse tan nerviosa que me bloqueé a la mitad. Todos me miraban y sentí que quería desaparecer. Mis manos temblaban y no podía recordar nada. Llevo días evitando salir de mi cuarto por vergüenza.",
    sentimiento:"desafiante", score_pos:0.0456, score_neg:0.7890, score_neu:0.1654, confianza:0.7890,
    emocion_predo:"Ansioso",
    palabras:kw("nerviosa","vergüenza","miedo","bloqueé","temblaba"),
    alertas:[alerta("warning","Ansiedad social intensa. Requiere intervención terapéutica activa.")]
  },
  {
    fecha:"2026-03-11", emocion:"Preocupado",
    texto:"Esta semana practiqué hablar con personas en la cafetería de la universidad, como acordé con el psicólogo. Fue incómodo pero no tan catastrófico como pensaba. Pude tener una conversación corta con un compañero de clase. Todavía me pongo nerviosa pero creo que puedo superarlo.",
    sentimiento:"equilibrado", score_pos:0.3234, score_neg:0.3789, score_neu:0.2977, confianza:0.3789,
    emocion_predo:"Ansioso",
    palabras:kw("práctica","compañero","incómodo","nerviosa","progresando"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Tranquilo",
    texto:"Fui a una fiesta de cumpleaños de mi compañera. Pensé que sería un desastre pero en realidad estuvo bien. Hablé con varias personas y aunque me sentía un poco tensa, pude disfrutarlo. Llegué a casa sorprendida de haberlo logrado. El psicólogo tiene razón, la práctica ayuda.",
    sentimiento:"equilibrado", score_pos:0.4567, score_neg:0.2345, score_neu:0.3088, confianza:0.4567,
    emocion_predo:"Tranquilo",
    palabras:kw("logré","práctica","sorprendida","bien","disfrutarlo"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Contento",
    texto:"Participé voluntariamente en clase por primera vez en semestres. Levanté la mano y respondí una pregunta. El profesor me felicitó y mis compañeros me sonrieron. Me sentí muy orgullosa de mí misma. Creo que estoy dejando atrás el miedo poco a poco.",
    sentimiento:"esperanzador", score_pos:0.7234, score_neg:0.0789, score_neu:0.1977, confianza:0.7234,
    emocion_predo:"Feliz",
    palabras:kw("orgullosa","logro","confianza","participé","mejoría"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Feliz",
    texto:"Increíble semana. Quedé con un grupo de compañeros para estudiar juntos y pasé una tarde genial. Reímos mucho y pude ser yo misma sin tanta presión. Me siento más segura de mí misma que nunca. La terapia y el esfuerzo están valiendo la pena. ¡Estoy feliz!",
    sentimiento:"esperanzador", score_pos:0.8567, score_neg:0.0456, score_neu:0.0977, confianza:0.8567,
    emocion_predo:"Feliz",
    palabras:kw("segura","feliz","genial","logros","confianza"),
    alertas:[]
  },
];

// PA[5] – Diego Morales – Post-divorcio (EMPEORA → ESTABILIZA)
const diarios_pa5: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Triste",
    texto:"El divorcio se finalizó esta semana. Firmamos los papeles y salí del juzgado sintiéndome completamente destrozado. 12 años juntos y de repente nada. Echo de menos a mis hijos terriblemente, solo los veo los fines de semana. Siento que fracasé como esposo y como padre.",
    sentimiento:"desafiante", score_pos:0.0456, score_neg:0.8123, score_neu:0.1421, confianza:0.8123,
    emocion_predo:"Triste",
    palabras:kw("divorcio","fracaso","hijos","tristeza","destrozado"),
    alertas:[alerta("warning","Trauma significativo relacionado con separación familiar. Requiere acompañamiento terapéutico continuo.")]
  },
  {
    fecha:"2026-03-11", emocion:"Deprimido",
    texto:"Esta semana fue la peor. Vi a mis hijos el sábado y cuando se tuvieron que ir con su madre me rompí por dentro. Lloré durante horas. No puedo dejar de pensar en cómo era nuestra vida antes. Estoy bebiendo más de lo que debería para no sentir. Sé que no es la solución.",
    sentimiento:"desafiante", score_pos:0.0234, score_neg:0.8789, score_neu:0.0977, confianza:0.8789,
    emocion_predo:"Triste",
    palabras:kw("lloré","hijos","dolor","bebiendo","tristeza"),
    alertas:[
      alerta("critical","Se mencionan mecanismos de evitación nocivos (consumo de alcohol). Se requiere intervención inmediata."),
      alerta("warning","Alto nivel de angustia emocional relacionada con separación familiar.")
    ]
  },
  {
    fecha:"2026-03-18", emocion:"Neutral",
    texto:"Hablé con la psicóloga sobre el alcohol y acordamos que debo parar. Lo intenté esta semana y no bebí. Fue duro pero lo logré. Los días con mis hijos son los únicos momentos buenos. Cuando no están todo se pone gris otra vez. Intento mantenerme ocupado para no caer.",
    sentimiento:"desafiante", score_pos:0.1789, score_neg:0.5678, score_neu:0.2533, confianza:0.5678,
    emocion_predo:"Triste",
    palabras:kw("hijos","logré","gris","intentando","dolor"),
    alertas:[alerta("info","El paciente muestra esfuerzo en trabajar los mecanismos de evitación. Continuar reforzando.")]
  },
  {
    fecha:"2026-03-25", emocion:"Tranquilo",
    texto:"Semana más estable. No bebí en absoluto. Pasé tiempo de calidad con mis hijos el fin de semana y construí un castillo de LEGO con ellos, fue hermoso. Empiezo a entender que puedo ser un buen padre aunque el matrimonio no funcionó. La psicóloga me ayuda a ver las cosas con más perspectiva.",
    sentimiento:"equilibrado", score_pos:0.3789, score_neg:0.3234, score_neu:0.2977, confianza:0.3789,
    emocion_predo:"Tranquilo",
    palabras:kw("hijos","hermoso","estable","perspectiva","padre"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Tranquilo",
    texto:"Sigo trabajando en aceptar la nueva realidad. Esta semana incluso pude tener una conversación cordial con mi ex esposa sobre los niños. Fue difícil pero necesario. Me siento más centrado. Todavía hay dolor pero ya no me consume tanto. Estoy aprendiendo a construir una nueva vida.",
    sentimiento:"equilibrado", score_pos:0.3456, score_neg:0.2789, score_neu:0.3755, confianza:0.3755,
    emocion_predo:"Tranquilo",
    palabras:kw("aceptar","centrado","construir","nueva_vida","cordial"),
    alertas:[]
  },
];

// PA[6] – Patricia Vásquez – Duelo materno (MEJORANDO LENTO)
const diarios_pa6: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Triste",
    texto:"Hace dos meses perdí a mi mamá. La extraño cada día de mi vida. Hoy encontré su suéter favorito en el armario y me puse a llorar durante horas. La ausencia es insoportable. Nadie te prepara para perder a tu madre. Me pregunto si algún día deja de doler tanto.",
    sentimiento:"desafiante", score_pos:0.0345, score_neg:0.7890, score_neu:0.1765, confianza:0.7890,
    emocion_predo:"Triste",
    palabras:kw("extraño","lloré","dolor","ausencia","madre"),
    alertas:[alerta("warning","Duelo intenso en proceso. Monitorear signos de duelo complicado.")]
  },
  {
    fecha:"2026-03-11", emocion:"Triste",
    texto:"Esta semana fuimos a visitar la tumba de mamá con mi hermana. Fue triste pero también algo hermoso, compartimos recuerdos bonitos de ella y nos reímos recordando sus chistes malos. Me hace bien hablar de ella. Todavía hay mucho dolor pero la compañía de mi hermana ayuda.",
    sentimiento:"desafiante", score_pos:0.1789, score_neg:0.6123, score_neu:0.2088, confianza:0.6123,
    emocion_predo:"Triste",
    palabras:kw("mamá","recuerdos","dolor","hermana","triste"),
    alertas:[alerta("info","La paciente está procesando el duelo de forma activa con apoyo familiar. Buen indicador.")]
  },
  {
    fecha:"2026-03-18", emocion:"Neutral",
    texto:"Empecé a cocinar las recetas de mamá esta semana. Cuando hice su sopa de maní lloré pero también sonreí recordándola. Creo que encontrar formas de mantener su presencia en mi vida me ayuda. La psicóloga dice que esto es parte sana del duelo. Me siento un poco más en paz.",
    sentimiento:"equilibrado", score_pos:0.2456, score_neg:0.3789, score_neu:0.3755, confianza:0.3789,
    emocion_predo:"Tranquilo",
    palabras:kw("mamá","recuerdos","paz","cocinando","sonreí"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Tranquilo",
    texto:"Volví al trabajo esta semana después de la licencia. Fue duro enfrentarme a todos, pero mis colegas fueron muy amables. En la tarde hubo un momento en que sentí que podía respirar normalmente. El duelo sigue pero la vida también continúa. Mamá querría que siguiera adelante.",
    sentimiento:"equilibrado", score_pos:0.3567, score_neg:0.3123, score_neu:0.3310, confianza:0.3567,
    emocion_predo:"Tranquilo",
    palabras:kw("trabajo","mamá","adelante","amable","paz"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Contento",
    texto:"Hoy es el primer día que sonreí genuinamente pensando en mamá sin que me aplastara la tristeza. Recordé una historia graciosa que le pasó y me reí sola. Creo que estoy aprendiendo a llevar el duelo de una manera más sana. La quiero y la extraño, pero estoy bien.",
    sentimiento:"esperanzador", score_pos:0.4789, score_neg:0.2234, score_neu:0.2977, confianza:0.4789,
    emocion_predo:"Agradecido",
    palabras:kw("mamá","sonreí","bien","sana","recuerdos"),
    alertas:[]
  },
];

// PA[7] – Carmen Delgado – Conflicto familiar (ESTABLE)
const diarios_pa7: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Estresado",
    texto:"Los problemas con mi hijo mayor continúan. No trabaja, vive en casa y cuando le digo algo se pone agresivo verbalmente. Mi esposo y yo no estamos de acuerdo sobre cómo manejarlo y eso nos genera tensión. Me siento muy estresada y sin saber qué hacer.",
    sentimiento:"desafiante", score_pos:0.0567, score_neg:0.6789, score_neu:0.2644, confianza:0.6789,
    emocion_predo:"Estresado",
    palabras:kw("estrés","conflicto","hijo","tensión","atrapada"),
    alertas:[alerta("warning","Estrés familiar elevado. Evaluar dinámica familiar en sesiones.")]
  },
  {
    fecha:"2026-03-11", emocion:"Neutral",
    texto:"Hubo una conversación difícil con mi hijo esta semana. Le puse límites claros: tiene tres meses para encontrar trabajo o debe buscar otro lugar donde vivir. Se enojó mucho pero yo me sentí bien de haberlo dicho. La psicóloga me ayudó a preparar esa conversación.",
    sentimiento:"equilibrado", score_pos:0.3789, score_neg:0.3456, score_neu:0.2755, confianza:0.3789,
    emocion_predo:"Tranquilo",
    palabras:kw("límites","conversación","bien","preparada","hijo"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Tranquilo",
    texto:"Mi hijo empezó a buscar trabajo, al menos eso dice. Sigo escéptica pero espero que sea verdad. Mi esposo y yo tuvimos una cena solos por primera vez en meses y fue bonito reconectar. Me siento un poco más esperanzada con la situación familiar.",
    sentimiento:"equilibrado", score_pos:0.4123, score_neg:0.2789, score_neu:0.3088, confianza:0.4123,
    emocion_predo:"Tranquilo",
    palabras:kw("esperanza","esposo","cena","progreso","familia"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Neutral",
    texto:"Mi hijo tuvo una entrevista de trabajo. Estoy nerviosa por él aunque esté enojada con él. El amor de madre no desaparece. Mi esposo y yo estamos más unidos. Me siento más tranquila pero todavía hay tensión en casa. Espero que todo mejore pronto.",
    sentimiento:"equilibrado", score_pos:0.3123, score_neg:0.3234, score_neu:0.3643, confianza:0.3643,
    emocion_predo:"Tranquilo",
    palabras:kw("hijo","entrevista","familia","tranquila","tensión"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Feliz",
    texto:"¡Mi hijo consiguió el trabajo! Estoy muy aliviada y feliz por él. La casa está mucho más tranquila. Mi esposo y yo celebramos juntos. Todavía quedan dinámicas por mejorar pero este es un gran paso. La terapia me ayudó a manejar esto con más calma y perspectiva.",
    sentimiento:"esperanzador", score_pos:0.7456, score_neg:0.0789, score_neu:0.1755, confianza:0.7456,
    emocion_predo:"Feliz",
    palabras:kw("feliz","aliviada","trabajo","celebré","progreso"),
    alertas:[]
  },
];

// PA[8] – Andrés Castro – TOC leve (MEJORANDO)
const diarios_pa8: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Ansioso",
    texto:"Hoy revisé la puerta de mi apartamento 23 veces antes de poder irme. Sé que está cerrada pero no puedo evitar dudar. Llegué tarde al trabajo por esto. Me genera mucha vergüenza y frustración. Los pensamientos intrusivos son cada vez más frecuentes y me están robando tiempo y calidad de vida.",
    sentimiento:"desafiante", score_pos:0.0678, score_neg:0.7345, score_neu:0.1977, confianza:0.7345,
    emocion_predo:"Ansioso",
    palabras:kw("obsesivo","pensamientos","vergüenza","intrusivos","frustración"),
    alertas:[alerta("warning","Comportamientos compulsivos significativos afectando funcionamiento diario.")]
  },
  {
    fecha:"2026-03-11", emocion:"Preocupado",
    texto:"Practiqué la técnica de exposición con el psicólogo. El martes revisé la puerta solo 5 veces en lugar de 20 y luego me obligué a irme. La ansiedad fue intensa por 20 minutos pero luego pasó. Es como dijo el psicólogo: la ansiedad baja sola si no cedes a la compulsión.",
    sentimiento:"equilibrado", score_pos:0.2789, score_neg:0.4234, score_neu:0.2977, confianza:0.4234,
    emocion_predo:"Ansioso",
    palabras:kw("práctica","exposición","técnica","trabajando","ansiedad"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Tranquilo",
    texto:"Progreso notable esta semana. Revisé la puerta máximo 3 veces antes de irme. Los pensamientos intrusivos siguen pero ya no los obedezco como antes. El psicólogo dice que estoy respondiendo muy bien al tratamiento. Me siento más libre que hace un mes. Esto es posible de superar.",
    sentimiento:"equilibrado", score_pos:0.4234, score_neg:0.2567, score_neu:0.3199, confianza:0.4234,
    emocion_predo:"Motivado",
    palabras:kw("progreso","libre","técnica","mejora","posible"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Feliz",
    texto:"Revisé la puerta solo una vez esta semana. Solo UNA VEZ. Para alguien que hacía 20 revisiones, esto es enorme. Me siento orgulloso y emocionado. Los pensamientos intrusivos están disminuyendo en frecuencia. Estoy recuperando tiempo para vivir. El tratamiento está funcionando maravillosamente.",
    sentimiento:"esperanzador", score_pos:0.7789, score_neg:0.0789, score_neu:0.1422, confianza:0.7789,
    emocion_predo:"Feliz",
    palabras:kw("orgulloso","progreso","logro","libre","éxito"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Feliz",
    texto:"Esta semana pude salir sin revisar la puerta en dos ocasiones. En las otras puse el seguro, vi que cerré, y me fui sin necesidad de revisar más. Es un cambio enorme. Me siento como una persona nueva. Nunca pensé que esto fuera posible pero el trabajo duro y la terapia dan resultados.",
    sentimiento:"esperanzador", score_pos:0.8678, score_neg:0.0456, score_neu:0.0866, confianza:0.8678,
    emocion_predo:"Agradecido",
    palabras:kw("logré","libre","progreso","gracias","éxito"),
    alertas:[]
  },
];

// PA[9] – Lucía Méndez – Imagen corporal (MIXTO)
const diarios_pa9: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Triste",
    texto:"Hoy me pesé cuatro veces. Sé que no debería hacerlo con tanta frecuencia pero no puedo evitarlo. Me siento gorda aunque todos me digan que estoy bien. No comí bien hoy, tomé café y una ensalada pequeña. Me siento culpable cuando como algo que no debería.",
    sentimiento:"desafiante", score_pos:0.0567, score_neg:0.7234, score_neu:0.2199, confianza:0.7234,
    emocion_predo:"Triste",
    palabras:kw("gorda","culpable","pesé","comida","restricción"),
    alertas:[alerta("warning","Patrones alimentarios restrictivos detectados. Requiere evaluación y seguimiento especializado.")]
  },
  {
    fecha:"2026-03-11", emocion:"Neutral",
    texto:"El psicólogo me pidió que lleve un diario alimentario. Es incómodo ver escrito lo poco que como. Hoy intenté comer tres comidas completas y lo logré. Me sentí culpable después de cenar, pero practiqué los ejercicios de mindfulness y mejoró. Es un proceso muy difícil.",
    sentimiento:"equilibrado", score_pos:0.2234, score_neg:0.4567, score_neu:0.3199, confianza:0.4567,
    emocion_predo:"Tranquilo",
    palabras:kw("intenté","comida","mindfulness","proceso","logré"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Triste",
    texto:"Tuve una recaída esta semana. Estuve dos días comiendo muy poco después de que un comentario sobre mi peso me afectó mucho. Me siento frustrada conmigo misma por haber retrocedido. El psicólogo dice que las recaídas son parte del proceso y no significan fracaso. Lo entiendo pero es difícil.",
    sentimiento:"desafiante", score_pos:0.1234, score_neg:0.6345, score_neu:0.2421, confianza:0.6345,
    emocion_predo:"Triste",
    palabras:kw("recaída","frustrada","retroceso","difícil","peso"),
    alertas:[alerta("warning","Recaída en patrones alimentarios restrictivos. Reforzar estrategias de afrontamiento.")]
  },
  {
    fecha:"2026-03-25", emocion:"Tranquilo",
    texto:"Mejor semana después de la recaída. Hablé con el psicólogo sobre el comentario que me afectó y trabajamos en no darle tanto poder a lo que dicen los demás. Comí bien casi todos los días. Mi relación con la comida es todavía complicada pero estoy trabajando activamente.",
    sentimiento:"equilibrado", score_pos:0.3456, score_neg:0.3234, score_neu:0.3310, confianza:0.3456,
    emocion_predo:"Tranquilo",
    palabras:kw("mejor","trabajando","comida","progreso","recuperación"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Neutral",
    texto:"Esta semana comí bien la mayoría de los días. Hubo un día donde el pensamiento restrictivo fue muy fuerte pero usé las técnicas y pude comer normalmente. Me siento más fuerte que hace un mes aunque sé que queda mucho trabajo. Agradezco el apoyo de la terapia.",
    sentimiento:"equilibrado", score_pos:0.3789, score_neg:0.2789, score_neu:0.3422, confianza:0.3789,
    emocion_predo:"Motivado",
    palabras:kw("fuerte","técnicas","progreso","comida","agradecida"),
    alertas:[]
  },
];

// PA[10] – Felipe Ortega – Trastorno de pánico (MEJORANDO)
const diarios_pa10: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Ansioso",
    texto:"Tuve un ataque de pánico manejando en la autopista. Tuve que detener el carro y llamar a mi esposa. Me sentí como que me iba a morir, el corazón a mil, sin aire. Desde entonces no puedo manejar solo. Esto está afectando mi trabajo. Me siento inútil e incapaz.",
    sentimiento:"desafiante", score_pos:0.0567, score_neg:0.8012, score_neu:0.1421, confianza:0.8012,
    emocion_predo:"Ansioso",
    palabras:kw("pánico","miedo","ataque","incapaz","aterrado"),
    alertas:[alerta("warning","Trastorno de pánico con impacto funcional significativo. Requiere intervención activa.")]
  },
  {
    fecha:"2026-03-11", emocion:"Preocupado",
    texto:"Practiqué la respiración 4-7-8 que me enseñó el psicólogo. Este sábado manejé solo hasta el supermercado, que son 10 minutos. Estaba muy tenso pero lo logré. El psicólogo dice que esto es exposición gradual y que es exactamente lo que necesito. Pequeños pasos.",
    sentimiento:"equilibrado", score_pos:0.3234, score_neg:0.3789, score_neu:0.2977, confianza:0.3789,
    emocion_predo:"Ansioso",
    palabras:kw("logré","práctica","respiración","exposición","tenso"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Contento",
    texto:"Manejé al trabajo solo por primera vez en semanas. 40 minutos de ida y 40 de vuelta. Tuve momentos de ansiedad pero no llegué al pánico. Cuando sentí que subía la ansiedad, respiré y seguí. Al llegar a casa casi lloré de alivio y de orgullo. Esto es posible.",
    sentimiento:"esperanzador", score_pos:0.6234, score_neg:0.1567, score_neu:0.2199, confianza:0.6234,
    emocion_predo:"Motivado",
    palabras:kw("logré","manejé","orgullo","posible","superé"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Feliz",
    texto:"Semana sin ataques de pánico. La primera en meses. Manejé todos los días sin problemas. Me siento como que estoy recuperando mi vida. Mi esposa dice que me ve diferente, más tranquilo y seguro. Esto es lo que quería cuando empecé la terapia. Estoy muy agradecido.",
    sentimiento:"esperanzador", score_pos:0.7678, score_neg:0.0789, score_neu:0.1533, confianza:0.7678,
    emocion_predo:"Agradecido",
    palabras:kw("recuperando","tranquilo","logré","agradecido","libre"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Feliz",
    texto:"Excelente semana. Me ofrecí para llevar a mis hijos al colegio, algo que antes me daba terror. Lo hice sin ningún problema. La terapia me ha dado herramientas que realmente funcionan. Me siento muy bien y confiado. Quiero seguir mejorando pero también celebrar cuánto he avanzado.",
    sentimiento:"esperanzador", score_pos:0.8234, score_neg:0.0456, score_neu:0.1310, confianza:0.8234,
    emocion_predo:"Feliz",
    palabras:kw("excelente","logré","confiado","libre","celebrar"),
    alertas:[]
  },
];

// PA[11] – Isabel Romero – Autoestima/relaciones (MEJORANDO)
const diarios_pa11: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Triste",
    texto:"Terminé otra relación esta semana. Siempre termina igual: yo cedo demasiado, me pierdo a mí misma por complacer al otro, y al final me dejan de todas formas. El psicólogo dice que tengo un patrón que necesitamos trabajar. Creo que tiene razón. Estoy cansada de sufrir.",
    sentimiento:"desafiante", score_pos:0.0789, score_neg:0.6789, score_neu:0.2422, confianza:0.6789,
    emocion_predo:"Triste",
    palabras:kw("autoestima","patrón","cedo","pierdo","relación"),
    alertas:[alerta("info","Patrones relacionales disfuncionales identificados. Trabajo terapéutico en autoestima recomendado.")]
  },
  {
    fecha:"2026-03-11", emocion:"Neutral",
    texto:"Trabajé en identificar mis propias necesidades esta semana. Me di cuenta de que rara vez pienso en lo que yo quiero. Siempre me adapto al otro. Es revelador y un poco triste a la vez. Pero también me da esperanza de que puedo cambiar este patrón.",
    sentimiento:"equilibrado", score_pos:0.3234, score_neg:0.3456, score_neu:0.3310, confianza:0.3456,
    emocion_predo:"Tranquilo",
    palabras:kw("necesidades","revelador","esperanza","cambio","trabajando"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Tranquilo",
    texto:"Dije 'no' a algo por primera vez sin sentirme completamente culpable. Mi amiga me pidió un favor incómodo y lo rechacé cortésmente. Después esperé sentirme mal pero no fue tan terrible. El psicólogo dice que esto es establecer límites saludables y que es un gran paso.",
    sentimiento:"esperanzador", score_pos:0.6234, score_neg:0.1234, score_neu:0.2532, confianza:0.6234,
    emocion_predo:"Motivado",
    palabras:kw("límites","logré","no","saludable","progreso"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Contento",
    texto:"Esta semana pasé tiempo sola de manera intencional y lo disfruté. Fui al cine sola, algo que antes me parecía inconcebible. Me sentí bien conmigo misma. Creo que estoy aprendiendo a ser mi propia compañía. La autoestima se construye lentamente pero se siente el progreso.",
    sentimiento:"esperanzador", score_pos:0.7234, score_neg:0.0789, score_neu:0.1977, confianza:0.7234,
    emocion_predo:"Feliz",
    palabras:kw("autoestima","disfruté","sola","bien","logré"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Feliz",
    texto:"Empecé a salir con amigos que había descuidado. Pasé una tarde maravillosa con tres amigas que hacía meses no veía. Me reí mucho y me sentí querida y valorada tal como soy. No necesitaba cambiarme para gustarles. Eso es lo que quiero en mis relaciones. Estoy en el camino correcto.",
    sentimiento:"esperanzador", score_pos:0.8012, score_neg:0.0567, score_neu:0.1421, confianza:0.8012,
    emocion_predo:"Agradecido",
    palabras:kw("amigos","valorada","querida","auténtica","feliz"),
    alertas:[]
  },
];

// PA[12] – Rodrigo Paz – Dependencia alcohólica (DESAFIANTE → MEJORA)
const diarios_pa12: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Preocupado",
    texto:"Llevo 14 días sin beber. Es el récord más largo que he tenido en años. Pero hoy fue un día muy difícil, el deseo fue intenso cuando pasé por el bar donde solía ir. Llamé a mi sponsor y pude resistir. Me siento agotado emocionalmente pero orgulloso de haberlo superado.",
    sentimiento:"equilibrado", score_pos:0.3456, score_neg:0.4234, score_neu:0.2310, confianza:0.4234,
    emocion_predo:"Ansioso",
    palabras:kw("sobriedad","resistí","deseo","sponsor","orgulloso"),
    alertas:[alerta("warning","Cravings intensos reportados. Reforzar red de apoyo y estrategias de afrontamiento.")]
  },
  {
    fecha:"2026-03-11", emocion:"Deprimido",
    texto:"Recaída el miércoles. Bebí. Me siento muy avergonzado y decepcionado de mí mismo. Fui a ver a la psicóloga de urgencia y me ayudó a entender que una recaída no significa que el tratamiento fracasó. Mañana son de nuevo mis días cero. No me rindo.",
    sentimiento:"desafiante", score_pos:0.0678, score_neg:0.7678, score_neu:0.1644, confianza:0.7678,
    emocion_predo:"Triste",
    palabras:kw("recaída","avergonzado","decepcionado","no_me_rindo","recuperación"),
    alertas:[
      alerta("critical","Recaída en consumo de alcohol. Evaluación inmediata de nivel de riesgo."),
      alerta("warning","Recaída reciente. Requiere revisión del plan de tratamiento y refuerzo de estrategias.")
    ]
  },
  {
    fecha:"2026-03-18", emocion:"Neutral",
    texto:"Una semana de sobriedad nuevamente. Cuento los días. Estoy usando más las herramientas que me enseñó la psicóloga: llamar a mi sponsor, ir a las reuniones de AA, hacer ejercicio cuando el craving es intenso. Los días son duros pero estoy comprometido con mi recuperación.",
    sentimiento:"equilibrado", score_pos:0.2789, score_neg:0.3789, score_neu:0.3422, confianza:0.3789,
    emocion_predo:"Motivado",
    palabras:kw("sobriedad","comprometido","recuperación","herramientas","AA"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Tranquilo",
    texto:"18 días de sobriedad. Fui a tres reuniones de AA esta semana y me ayudaron mucho. Mi familia empieza a confiar más en mí de nuevo. Mi hijo me llamó para invitarme a su partido de fútbol. Eso me llena de fuerzas para continuar. Vale cada día difícil.",
    sentimiento:"esperanzador", score_pos:0.5678, score_neg:0.1567, score_neu:0.2755, confianza:0.5678,
    emocion_predo:"Motivado",
    palabras:kw("sobriedad","familia","AA","fortaleza","esperanza"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Feliz",
    texto:"25 días sin alcohol. Es mi récord personal. Fui al partido de fútbol de mi hijo y fue el mejor momento que he tenido en años. Él me abrazó y dijo que estaba orgulloso de mí. Nunca pensé que algo así me daría tanta fuerza. Quiero estar presente para los momentos que importan.",
    sentimiento:"esperanzador", score_pos:0.7234, score_neg:0.0789, score_neu:0.1977, confianza:0.7234,
    emocion_predo:"Agradecido",
    palabras:kw("sobriedad","hijo","orgulloso","presente","esperanza"),
    alertas:[]
  },
];

// PA[13] – Natalia Flores – Recuperación sustancias (ESTABLE)
const diarios_pa13: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Preocupado",
    texto:"Llevo 3 semanas sin consumir. Hoy me invitaron mis amigos del trabajo y dije que no, pero me costó mucho. Me fui a casa sintiéndome excluida. Es difícil mantener la sobriedad cuando tu círculo social no comparte tu proceso. Pero sé que debo seguir.",
    sentimiento:"equilibrado", score_pos:0.2234, score_neg:0.4567, score_neu:0.3199, confianza:0.4567,
    emocion_predo:"Ansioso",
    palabras:kw("sobriedad","excluida","dije_no","difícil","proceso"),
    alertas:[alerta("info","Presión social como factor de riesgo identificado. Trabajar red de apoyo alternativa.")]
  },
  {
    fecha:"2026-03-11", emocion:"Tranquilo",
    texto:"La psicóloga me ayudó a pensar en mi círculo social. Empecé a conectar más con amigos que no consumen. El fin de semana salí con una amiga al cine y fue genial, sin consumo y lo pasé bien. Me siento más segura en ambientes libres de sustancias.",
    sentimiento:"equilibrado", score_pos:0.3789, score_neg:0.2789, score_neu:0.3422, confianza:0.3789,
    emocion_predo:"Tranquilo",
    palabras:kw("amigos","segura","sobriedad","genial","socialicé"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Neutral",
    texto:"Semana difícil. Tuve mucho estrés laboral y el impulso de consumir fue más fuerte. No lo hice, pero hubo un momento en el que casi cedo. Usé la técnica HALT que me enseñó la psicóloga: estaba ansiosa y sola. Llamé a mi hermana. Pasó el impulso. Seguimos.",
    sentimiento:"equilibrado", score_pos:0.2789, score_neg:0.3456, score_neu:0.3755, confianza:0.3755,
    emocion_predo:"Tranquilo",
    palabras:kw("resistí","HALT","técnica","sobriedad","estrés"),
    alertas:[alerta("info","Impulso de consumo reportado pero manejado exitosamente. Reforzar estrategias de afrontamiento al estrés.")]
  },
  {
    fecha:"2026-03-25", emocion:"Contento",
    texto:"Un mes completo de sobriedad. Lo celebré con la psicóloga y con mi hermana. Me siento bien conmigo misma. El trabajo sigue siendo estresante pero ya no veo el consumo como la única salida. Tengo otras herramientas ahora. Estoy construyendo una vida más saludable.",
    sentimiento:"esperanzador", score_pos:0.6789, score_neg:0.0789, score_neu:0.2422, confianza:0.6789,
    emocion_predo:"Agradecido",
    palabras:kw("sobriedad","celebré","saludable","herramientas","logré"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Neutral",
    texto:"37 días de sobriedad. La vida no se pone más fácil de golpe, el trabajo sigue demandante y el círculo social todavía es complicado. Pero me siento más lúcida, más presente. Vale la pena el esfuerzo. La psicóloga dice que estoy haciendo un trabajo excelente.",
    sentimiento:"equilibrado", score_pos:0.4234, score_neg:0.1789, score_neu:0.3977, confianza:0.4234,
    emocion_predo:"Motivado",
    palabras:kw("sobriedad","lúcida","presente","vale_la_pena","progreso"),
    alertas:[]
  },
];

// PA[14] – Kevin Mamani – Depresión adolescente/bullying (MEJORANDO)
const diarios_pa14: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Triste",
    texto:"En el colegio sigo recibiendo burlas por mis gustos. Hoy me robaron mi mochila y cuando fui a decirle al profesor dijo que me la buscaba. Me sentí completamente solo y sin defensa. Llegué a casa llorando. No quiero ir más al colegio. Mis papás no entienden lo que vivo.",
    sentimiento:"desafiante", score_pos:0.0234, score_neg:0.8234, score_neu:0.1532, confianza:0.8234,
    emocion_predo:"Triste",
    palabras:kw("bullying","solo","lloré","injusto","triste"),
    alertas:[
      alerta("critical","Menor reporta sentirse completamente solo y sin apoyo institucional. Evaluar riesgo y activar protocolos de protección."),
      alerta("warning","Experiencias activas de bullying reportadas. Requiere intervención en el entorno escolar urgentemente.")
    ]
  },
  {
    fecha:"2026-03-11", emocion:"Neutral",
    texto:"El psicólogo habló con mis papás y ellos fueron al colegio a hablar con el director. Por fin alguien hizo algo. Los chicos del bullying fueron llamados a la dirección. Todavía me miran mal pero por ahora no se han metido conmigo. Me siento un poco más seguro.",
    sentimiento:"equilibrado", score_pos:0.2789, score_neg:0.3789, score_neu:0.3422, confianza:0.3789,
    emocion_predo:"Ansioso",
    palabras:kw("colegio","seguro","papás","miedo","director"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Contento",
    texto:"Esta semana hice un amigo nuevo en la clase de arte. Se llama Rodrigo y le gustan las mismas cosas que a mí. Por primera vez en mucho tiempo no me sentí raro por ser como soy. Almorzamos juntos tres veces. El psicólogo dice que tengo mucho que ofrecer como amigo.",
    sentimiento:"esperanzador", score_pos:0.6234, score_neg:0.1234, score_neu:0.2532, confianza:0.6234,
    emocion_predo:"Feliz",
    palabras:kw("amigo","feliz","aceptado","arte","logré"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Tranquilo",
    texto:"El grupo del bullying se está calmando. No hubo incidentes esta semana. Me senté con Rodrigo y sus amigos en el almuerzo y fueron muy amables. Empiezo a sentir que el colegio puede ser un lugar donde estar bien. Mi humor ha mejorado mucho y duermo mejor.",
    sentimiento:"esperanzador", score_pos:0.6789, score_neg:0.0789, score_neu:0.2422, confianza:0.6789,
    emocion_predo:"Feliz",
    palabras:kw("amigos","mejor","colegio","tranquilo","feliz"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Feliz",
    texto:"Semana genial. Rodrigo me invitó a su casa a jugar videojuegos y me la pasé muy bien. Me di cuenta de que tengo amigos que me valoran tal como soy. El bullying ya no me afecta de la misma manera porque ahora tengo donde apoyarme. Me siento mucho más fuerte y contento.",
    sentimiento:"esperanzador", score_pos:0.8456, score_neg:0.0345, score_neu:0.1199, confianza:0.8456,
    emocion_predo:"Feliz",
    palabras:kw("amigos","contento","feliz","fuerte","valorado"),
    alertas:[]
  },
];

// PA[15] – Daniela Chávez – Ansiedad escolar (MEJORANDO)
const diarios_pa15: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Ansioso",
    texto:"Mañana tengo examen de matemáticas y no puedo dormir. Siento que voy a reprobar aunque estudié muchísimo. Mi estómago está todo revuelto y tengo náuseas. El miedo a fallar me paraliza. Mis papás dicen que exagero pero el miedo es real. No sé cómo explicarles lo que siento.",
    sentimiento:"desafiante", score_pos:0.0567, score_neg:0.7456, score_neu:0.1977, confianza:0.7456,
    emocion_predo:"Ansioso",
    palabras:kw("ansiedad","examen","miedo","paraliza","nervios"),
    alertas:[alerta("warning","Ansiedad de rendimiento significativa afectando calidad de vida y sueño.")]
  },
  {
    fecha:"2026-03-11", emocion:"Tranquilo",
    texto:"Saqué 78 en el examen de mates. No es perfecto pero es bueno. El psicólogo dijo que esto prueba que mi ansiedad me hace exagerar lo que va a pasar. Practiqué la respiración antes del examen y ayudó. Todavía me pongo muy nerviosa ante los exámenes pero creo que puedo mejorar.",
    sentimiento:"equilibrado", score_pos:0.3789, score_neg:0.3234, score_neu:0.2977, confianza:0.3789,
    emocion_predo:"Tranquilo",
    palabras:kw("examen","respiración","bien","practiqué","progreso"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Feliz",
    texto:"Esta semana no hubo exámenes grandes y fue más tranquila. Me uní al club de teatro y ayer hicimos la primera práctica. Me puse nerviosa pero en cuanto empezamos me olvidé de los nervios. Descubrí que me encanta actuar. El psicólogo dice que esto me ayuda a manejar la ansiedad.",
    sentimiento:"esperanzador", score_pos:0.7234, score_neg:0.0789, score_neu:0.1977, confianza:0.7234,
    emocion_predo:"Feliz",
    palabras:kw("teatro","encanta","feliz","descubrí","tranquila"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Contento",
    texto:"Examen de Ciencias Naturales. Esta vez practiqué las técnicas antes del examen y no tuve tanta ansiedad. Me fue bien, saqué 85. Estoy aprendiendo que puedo hacer las cosas bien incluso cuando estoy nerviosa. La ansiedad no me controla como antes.",
    sentimiento:"esperanzador", score_pos:0.6789, score_neg:0.0789, score_neu:0.2422, confianza:0.6789,
    emocion_predo:"Motivado",
    palabras:kw("logré","técnicas","ansiedad","bien","progreso"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Feliz",
    texto:"Tuvimos obra de teatro en el colegio y yo tuve un papel pequeño. Me puse nerviosa antes de salir al escenario, pero en el momento me transformé. ¡Mis papás me aplaudieron! Fue increíble. El teatro me está cambiando. Me siento más segura de mí misma en general.",
    sentimiento:"esperanzador", score_pos:0.8234, score_neg:0.0456, score_neu:0.1310, confianza:0.8234,
    emocion_predo:"Feliz",
    palabras:kw("teatro","éxito","feliz","segura","logré"),
    alertas:[]
  },
];

// PA[16] – Tomás Gutiérrez – Trastorno de ajuste (ESTABLE)
const diarios_pa16: DiarioEntry[] = [
  {
    fecha:"2026-03-04", emocion:"Triste",
    texto:"Dejé la universidad el semestre pasado y aún no tengo claro qué quiero hacer con mi vida. Mis papás están decepcionados. Me siento perdido y sin dirección. Todo el mundo parece tener un plan excepto yo. Comparo mi vida con la de mis amigos y me parece que estoy muy atrás.",
    sentimiento:"desafiante", score_pos:0.0789, score_neg:0.6567, score_neu:0.2644, confianza:0.6567,
    emocion_predo:"Triste",
    palabras:kw("perdido","sin_dirección","decepcionado","comparación","futuro"),
    alertas:[alerta("info","Adulto joven en etapa de transición con dificultades de identidad y propósito. Enfocar en exploración vocacional.")]
  },
  {
    fecha:"2026-03-11", emocion:"Neutral",
    texto:"Hablé con el psicólogo sobre mis intereses reales. Cuando dejo de pensar en lo que debería hacer y pienso en lo que me gusta, aparece el diseño gráfico. Siempre me ha gustado pero nunca lo tomé en serio. El psicólogo me hizo ver que eso es una creencia limitante.",
    sentimiento:"equilibrado", score_pos:0.3789, score_neg:0.2789, score_neu:0.3422, confianza:0.3789,
    emocion_predo:"Tranquilo",
    palabras:kw("diseño","intereses","reflexión","creencia","descubriendo"),
    alertas:[]
  },
  {
    fecha:"2026-03-18", emocion:"Contento",
    texto:"Empecé a ver tutoriales de diseño gráfico online. Me absorbí tanto que no sentí el tiempo pasar. Fue la primera vez en meses que me sentí motivado por algo. Mostré algo de mi trabajo a mi mamá y vio que estaba contento. Eso me importa.",
    sentimiento:"esperanzador", score_pos:0.5789, score_neg:0.1234, score_neu:0.2977, confianza:0.5789,
    emocion_predo:"Motivado",
    palabras:kw("diseño","motivado","contento","aprendiendo","progreso"),
    alertas:[]
  },
  {
    fecha:"2026-03-25", emocion:"Tranquilo",
    texto:"Me inscribí en un curso de diseño gráfico online. Tuve una conversación honesta con mis papás sobre mi plan y lo recibieron mejor de lo esperado. Mi papá dijo que si es lo que quiero, me apoya. Eso significó mucho. Me siento con más dirección ahora.",
    sentimiento:"esperanzador", score_pos:0.6234, score_neg:0.0789, score_neu:0.2977, confianza:0.6234,
    emocion_predo:"Motivado",
    palabras:kw("diseño","papás","dirección","apoyo","plan"),
    alertas:[]
  },
  {
    fecha:"2026-04-01", emocion:"Contento",
    texto:"Completé el primer módulo del curso de diseño. Hice mi primer logo y quedó bien. Lo publiqué en una comunidad online y recibí comentarios positivos de personas que no me conocen. Eso me confirmó que tengo talento y que vale la pena seguir. Me siento con propósito.",
    sentimiento:"esperanzador", score_pos:0.7456, score_neg:0.0567, score_neu:0.1977, confianza:0.7456,
    emocion_predo:"Motivado",
    palabras:kw("diseño","logré","talento","propósito","motivado"),
    alertas:[]
  },
];

// Map patient ID → diary data
const PATIENT_DIARIOS: Record<string, DiarioEntry[]> = {
  [PA[1]]: diarios_pa1,
  [PA[2]]: diarios_pa2,
  [PA[3]]: diarios_pa3,
  [PA[4]]: diarios_pa4,
  [PA[5]]: diarios_pa5,
  [PA[6]]: diarios_pa6,
  [PA[7]]: diarios_pa7,
  [PA[8]]: diarios_pa8,
  [PA[9]]: diarios_pa9,
  [PA[10]]: diarios_pa10,
  [PA[11]]: diarios_pa11,
  [PA[12]]: diarios_pa12,
  [PA[13]]: diarios_pa13,
  [PA[14]]: diarios_pa14,
  [PA[15]]: diarios_pa15,
  [PA[16]]: diarios_pa16,
};

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
async function main() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  try {
    await qr.startTransaction();

    // ── Truncate (cascade) ──────────────────────────────
    await qr.query(`TRUNCATE TABLE
      analisis_sentimiento, diario_emocional, registro_tareas_terapeuticas,
      historial_sesion, citas, historial_tratamiento, antecedentes_paciente,
      pacientes, psicologos, usuarios, consultorios, roles
      CASCADE`);

    // ── 1. Roles ────────────────────────────────────────
    await qr.query(`
      INSERT INTO roles (id, name) VALUES
      ($1, 'admin'),
      ($2, 'psicologo')
    `, [R_ADMIN, R_PSICO]);

    // ── 2. Consultorios ─────────────────────────────────
    await qr.query(`
      INSERT INTO consultorios (id, name) VALUES
      ($1, 'Consultorio Central'),
      ($2, 'Consultorio Norte'),
      ($3, 'Consultorio Sur')
    `, [C1, C2, C3]);

    // ── 3. Usuarios (passwords hashed) ──────────────────
    const SALT = 10;
    const hash = (pw: string) => bcrypt.hash(pw, SALT);

    const [hAdmin, hCmend, hAflor, hRvarg, hMquisp, hJtorr] = await Promise.all([
      hash("Admin@2024!"),
      hash("Mendoza@2024!"),
      hash("Flores@2024!"),
      hash("Vargas@2024!"),
      hash("Quispe@2024!"),
      hash("Torres@2024!"),
    ]);

    await qr.query(`
      INSERT INTO usuarios (id, user_name, password_hash, role_id) VALUES
      ($1,  'admin',    $7,  $13),
      ($2,  'cmendoza', $8,  $14),
      ($3,  'aflores',  $9,  $14),
      ($4,  'rvargas',  $10, $14),
      ($5,  'mquispe',  $11, $14),
      ($6,  'jtorres',  $12, $14)
    `, [
      U_ADMIN, U_CMEND, U_AFLOR, U_RVARG, U_MQUISP, U_JTORR,
      hAdmin, hCmend, hAflor, hRvarg, hMquisp, hJtorr,
      R_ADMIN, R_PSICO,
    ]);

    // ── 4. Psicólogos ───────────────────────────────────
    await qr.query(`
      INSERT INTO psicologos
        (id, usuario_id, nombres, apellidos, email, telefono, ciudad,
         ci, profesion, matricula_profesional, universidad, anios_experiencia,
         descripcion, especialidades, genero, fecha_nacimiento)
      VALUES
      ($1,$2,'Carlos','Mendoza Rojas','cmendoza@clinica.bo','+591 70112233','La Paz',
       '1234567','Psicólogo Clínico','PSI-LP-00123','UMSA',8,
       'Especialista en ansiedad, depresión y trastornos del estado de ánimo.',
       ARRAY['Ansiedad','Depresión','Trastornos del ánimo'],'Masculino','1986-04-15'),

      ($3,$4,'Ana','Flores Mamani','aflores@clinica.bo','+591 70223344','La Paz',
       '2345678','Psicóloga Clínica','PSI-LP-00234','UCB',11,
       'Especializada en duelo, trauma y terapia familiar sistémica.',
       ARRAY['Duelo','Trauma','Terapia familiar'],'Femenino','1983-09-22'),

      ($5,$6,'Roberto','Vargas Condori','rvargas@clinica.bo','+591 70334455','El Alto',
       '3456789','Psicólogo Clínico','PSI-EA-00345','EMI',6,
       'Experto en terapia cognitivo-conductual y trastornos de ansiedad.',
       ARRAY['TCC','TOC','Trastorno de pánico','Autoestima'],'Masculino','1989-02-10'),

      ($7,$8,'María','Quispe Apaza','mquispe@clinica.bo','+591 70445566','La Paz',
       '4567890','Psicóloga Clínica','PSI-LP-00456','UMSA',9,
       'Especialista en adicciones, conductas de riesgo y motivación al cambio.',
       ARRAY['Adicciones','Dependencia','Motivación'],'Femenino','1985-11-30'),

      ($9,$10,'Javier','Torres Huanca','jtorres@clinica.bo','+591 70556677','La Paz',
       '5678901','Psicólogo Clínico','PSI-LP-00567','UCB',7,
       'Especializado en psicología infantil, adolescente y trastornos del desarrollo.',
       ARRAY['Infanto-juvenil','Bullying','Ansiedad escolar','Ajuste'],'Masculino','1987-06-18')
    `, [
      PS_CMEND, U_CMEND,
      PS_AFLOR, U_AFLOR,
      PS_RVARG, U_RVARG,
      PS_MQUISP, U_MQUISP,
      PS_JTORR, U_JTORR,
    ]);

    // ── 5. Pacientes ────────────────────────────────────
    type PacRow = [string, string, string, string, string, string, string, string, string, string, string];
    const pacientes: PacRow[] = [
      // cmendoza (PA 1–4)
      [PA[1], PS_CMEND,'Luis','Rodríguez Poma','1994-03-12','Masculino','Universitaria','Ingeniero de sistemas','Soltero','+591 70001111','5003001'],
      [PA[2], PS_CMEND,'Valentina','Cárdenas Vela','1997-08-25','Femenino','Universitaria','Diseñadora gráfica','Soltera','+591 70002222','5003002'],
      [PA[3], PS_CMEND,'Marco','Herrera Salinas','1980-11-03','Masculino','Universitaria','Gerente comercial','Casado','+591 70003333','5003003'],
      [PA[4], PS_CMEND,'Sofía','Aguilar Torrez','2006-05-19','Femenino','Secundaria','Estudiante universitaria','Soltera','+591 70004444','5003004'],
      // aflores (PA 5–7)
      [PA[5], PS_AFLOR,'Diego','Morales Quisbert','1990-07-14','Masculino','Universitaria','Contador','Divorciado','+591 70005555','5003005'],
      [PA[6], PS_AFLOR,'Patricia','Vásquez Mamani','1984-01-29','Femenino','Universitaria','Enfermera','Casada','+591 70006666','5003006'],
      [PA[7], PS_AFLOR,'Carmen','Delgado Espinoza','1973-04-08','Femenino','Secundaria','Ama de casa','Casada','+591 70007777','5003007'],
      // rvargas (PA 8–11)
      [PA[8], PS_RVARG,'Andrés','Castro Navia','1995-12-22','Masculino','Universitaria','Analista de datos','Soltero','+591 70008888','5003008'],
      [PA[9], PS_RVARG,'Lucía','Méndez Blanco','2001-06-07','Femenino','Universitaria','Estudiante universitaria','Soltera','+591 70009999','5003009'],
      [PA[10],PS_RVARG,'Felipe','Ortega Serrudo','1987-09-30','Masculino','Universitaria','Vendedor','Casado','+591 70010101','5003010'],
      [PA[11],PS_RVARG,'Isabel','Romero Chura','1992-02-14','Femenino','Universitaria','Abogada','Soltera','+591 70011111','5003011'],
      // mquispe (PA 12–13)
      [PA[12],PS_MQUISP,'Rodrigo','Paz Zenteno','1985-10-05','Masculino','Secundaria','Albañil','Casado','+591 70012121','5003012'],
      [PA[13],PS_MQUISP,'Natalia','Flores Castillo','1994-03-17','Femenino','Universitaria','Asistente administrativa','Soltera','+591 70013131','5003013'],
      // jtorres (PA 14–16)
      [PA[14],PS_JTORR,'Kevin','Mamani Lipa','2009-08-11','Masculino','Secundaria','Estudiante','Soltero','+591 70014141','5003014'],
      [PA[15],PS_JTORR,'Daniela','Chávez Pinto','2011-11-23','Femenino','Secundaria','Estudiante','Soltera','+591 70015151','5003015'],
      [PA[16],PS_JTORR,'Tomás','Gutiérrez Rada','2003-04-02','Masculino','Secundaria','Desempleado','Soltero','+591 70016161','5003016'],
    ];

    for (const [id, psico_id, nom, ape, fnac, sexo, escol, ocup, eciv, tel, ci] of pacientes) {
      await qr.query(`
        INSERT INTO pacientes
          (id, psicologo_id, nombres, apellidos, fecha_nacimiento, sexo,
           escolaridad, ocupacion, estado_civil, telefono, ci, fecha_ingreso)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'2026-03-01')
      `, [id, psico_id, nom, ape, fnac, sexo, escol, ocup, eciv, tel, ci]);
    }

    // ── 6. Antecedentes ─────────────────────────────────
    const antecedentes: Array<[string, string, string, string]> = [
      [PA[1], 'Episodios de ansiedad desde la adolescencia, sin tratamiento previo.',
               'Padre con hipertensión. Hermano mayor con trastorno de ansiedad.',
               'Sin diagnósticos psiquiátricos previos. Sin medicación actual.'],
      [PA[2], 'Primer episodio depresivo a los 23 años. Intentó terapia brevemente pero abandonó.',
               'Madre con depresión mayor tratada. Abuela materna con historial de salud mental.',
               'Diagnóstico previo de depresión leve. Sin medicación actual.'],
      [PA[3], 'Sin antecedentes terapéuticos. Primera consulta psicológica.',
               'Sin antecedentes familiares de salud mental conocidos.',
               'Hipertensión leve en control médico.'],
      [PA[4], 'Sin terapia previa. Evitación social desde secundaria.',
               'Sin antecedentes familiares relevantes.',
               'Sin diagnósticos previos. Sin medicación.'],
      [PA[5], 'Terapia de pareja fallida hace 1 año.',
               'Padre con alcoholismo. Sin otros antecedentes.',
               'Sin diagnósticos psiquiátricos. Refiere consumo elevado de alcohol en período de crisis.'],
      [PA[6], 'Sin terapia previa.',
               'Madre fallecida recientemente (causa: enfermedad crónica). Sin otros antecedentes relevantes.',
               'Sin diagnósticos. Sin medicación.'],
      [PA[7], 'Consultas esporádicas con médico de cabecera por "estrés".',
               'Sin antecedentes familiares de salud mental.',
               'Diabetes tipo 2 en control. Tensión alta esporádica.'],
      [PA[8], 'Sin terapia previa. Reconoce conductas repetitivas desde la infancia.',
               'Madre con rasgos ansiosos. Sin diagnósticos formales.',
               'Sin diagnósticos psiquiátricos. Sin medicación.'],
      [PA[9], 'Consulta nutricionista hace 6 meses por "control de peso".',
               'Tía materna con anorexia nerviosa. Madre con relación conflictiva con la alimentación.',
               'Sin diagnósticos formales. Peso dentro de rango normal según IMC.'],
      [PA[10],'Sin terapia previa.',
              'Padre con hipertensión y cardiopatía. Genera ansiedad anticipatoria.',
              'Sin diagnósticos psiquiátricos. Sin medicación.'],
      [PA[11],'Terapia breve hace 2 años, abandonó después de 3 sesiones.',
              'Sin antecedentes familiares relevantes.',
              'Sin diagnósticos formales.'],
      [PA[12],'Internación en centro de desintoxicación hace 3 años, recaída posterior.',
              'Padre alcohólico. Hermano con dependencia a sustancias.',
              'Dependencia alcohólica diagnosticada. En seguimiento.'],
      [PA[13],'Sin terapia previa formal.',
              'Sin antecedentes familiares de adicciones.',
              'Sin diagnósticos psiquiátricos. Consumo de marihuana desde los 19 años.'],
      [PA[14],'Sin terapia previa.',
              'Sin antecedentes familiares relevantes.',
              'Sin diagnósticos. Sin medicación.'],
      [PA[15],'Sin terapia previa.',
              'Madre con ansiedad generalizada tratada con medicación.',
              'Sin diagnósticos. Sin medicación.'],
      [PA[16],'Sin terapia previa.',
              'Padre con depresión leve. Sin otros antecedentes.',
              'Sin diagnósticos formales.'],
    ];

    for (const [pid, pers, fam, med] of antecedentes) {
      await qr.query(`
        INSERT INTO antecedentes_paciente (id, paciente_id, personales, familiares, medicos_psiquiatricos)
        VALUES ($1,$2,$3,$4,$5)
      `, [randomUUID(), pid, enc(pers), enc(fam), enc(med)]);
    }

    // ── 7. Historial Tratamiento ────────────────────────
    type TrRow = {
      id: string; pacId: string; psId: string;
      tipo: string; sesiones: number;
      obs: string; hipotesis: string; diagnostico: string;
      objetivo: string; plan: string;
    };
    const tratamientos: TrRow[] = [
      {id:TR[1],pacId:PA[1],psId:PS_CMEND,tipo:'Cognitivo-Conductual',sesiones:16,
       obs:'Paciente presenta ansiedad severa con episodios de pánico en contextos laborales. Evitación significativa.',
       hipotesis:'Trastorno de ansiedad generalizada con ataques de pánico situacionales.',
       diagnostico:'TAG con componente fóbico laboral.',
       objetivo:'Reducir frecuencia e intensidad de ataques de pánico. Desarrollar tolerancia a situaciones de incertidumbre.',
       plan:'Psicoeducación, reestructuración cognitiva, técnicas de respiración y exposición gradual.'},
      {id:TR[2],pacId:PA[2],psId:PS_CMEND,tipo:'Cognitivo-Conductual',sesiones:20,
       obs:'Paciente con episodio depresivo mayor. Anhedonia, anergia, isolamiento social.',
       hipotesis:'Episodio depresivo mayor de intensidad moderada-severa.',
       diagnostico:'Depresión mayor, primer episodio.',
       objetivo:'Remisión del episodio depresivo. Activación conductual. Prevención de recaídas.',
       plan:'Activación conductual, registro de pensamientos, intervención en red social, higiene del sueño.'},
      {id:TR[3],pacId:PA[3],psId:PS_CMEND,tipo:'Terapia Breve Centrada en Soluciones',sesiones:12,
       obs:'Burnout laboral con afectación familiar. Dificultad para establecer límites.',
       hipotesis:'Síndrome de burnout con componente de dificultad en establecimiento de límites.',
       diagnostico:'Burnout laboral (CIE-11 QD85).',
       objetivo:'Establecer límites laborales saludables. Recuperar balance vida-trabajo.',
       plan:'Técnicas de manejo del estrés, entrenamiento en asertividad, reestructuración de prioridades.'},
      {id:TR[4],pacId:PA[4],psId:PS_CMEND,tipo:'Cognitivo-Conductual',sesiones:16,
       obs:'Ansiedad social severa con evitación de exposición pública.',
       hipotesis:'Trastorno de ansiedad social (fobia social).',
       diagnostico:'Fobia social, forma generalizada.',
       objetivo:'Reducir ansiedad en situaciones sociales. Ampliar repertorio de interacciones.',
       plan:'Exposición gradual, entrenamiento en habilidades sociales, desafío de creencias catastróficas.'},
      {id:TR[5],pacId:PA[5],psId:PS_AFLOR,tipo:'Terapia de Duelo y Trauma',sesiones:20,
       obs:'Trauma por divorcio, separación de hijos, inicio de consumo de alcohol como evitación.',
       hipotesis:'Trastorno adaptativo con estado de ánimo depresivo y conductas de evitación.',
       diagnostico:'Trastorno adaptativo post-divorcio con componente de duelo.',
       objetivo:'Elaborar duelo de la relación. Establecer nueva identidad. Eliminar consumo de alcohol.',
       plan:'Terapia de duelo, técnicas narrativas, psicoeducación sobre alcohol como evitación, red de apoyo.'},
      {id:TR[6],pacId:PA[6],psId:PS_AFLOR,tipo:'Terapia de Duelo',sesiones:16,
       obs:'Duelo por fallecimiento de madre hace 2 meses. Primera consulta psicológica.',
       hipotesis:'Duelo normal en etapa de elaboración activa.',
       diagnostico:'Duelo por pérdida de figura materna.',
       objetivo:'Acompañar proceso de elaboración del duelo. Prevenir complicaciones.',
       plan:'Trabajo narrativo del duelo, rituales simbólicos, integración de la pérdida, red de apoyo familiar.'},
      {id:TR[7],pacId:PA[7],psId:PS_AFLOR,tipo:'Terapia Sistémica Familiar',sesiones:12,
       obs:'Conflicto familiar crónico con hijo adulto. Estrés de pareja secundario.',
       hipotesis:'Disfunción familiar con patrones de comunicación inadecuados.',
       diagnostico:'Problemática relacional familiar.',
       objetivo:'Mejorar comunicación familiar. Establecer límites. Fortalecer vínculo de pareja.',
       plan:'Mapeo de patrones relacionales, entrenamiento en comunicación asertiva, trabajo en límites.'},
      {id:TR[8],pacId:PA[8],psId:PS_RVARG,tipo:'Cognitivo-Conductual (ERP)',sesiones:20,
       obs:'TOC leve con rituales de comprobación que afectan funcionamiento diario.',
       hipotesis:'Trastorno obsesivo-compulsivo de intensidad leve-moderada.',
       diagnostico:'TOC con rituales de comprobación.',
       objetivo:'Reducir rituales compulsivos. Aumentar tolerancia a la incertidumbre.',
       plan:'Psicoeducación sobre TOC, exposición con prevención de respuesta (ERP), reestructuración cognitiva.'},
      {id:TR[9],pacId:PA[9],psId:PS_RVARG,tipo:'Cognitivo-Conductual',sesiones:24,
       obs:'Restricción alimentaria con distorsión de imagen corporal. Perfeccionismo elevado.',
       hipotesis:'Trastorno de la conducta alimentaria no especificado con componente de distorsión de imagen.',
       diagnostico:'TCA-NE con restricción y distorsión de imagen corporal.',
       objetivo:'Normalizar conducta alimentaria. Mejorar imagen corporal. Reducir perfeccionismo.',
       plan:'Psicoeducación nutricional, diario alimentario, trabajo en imagen corporal, reestructuración cognitiva.'},
      {id:TR[10],pacId:PA[10],psId:PS_RVARG,tipo:'Cognitivo-Conductual',sesiones:16,
       obs:'Trastorno de pánico con evitación de conducción. Impacto funcional significativo.',
       hipotesis:'Trastorno de pánico con agorafobia situacional.',
       diagnostico:'Trastorno de pánico con evitación fóbica.',
       objetivo:'Eliminar ataques de pánico. Recuperar conducción autónoma.',
       plan:'Psicoeducación, técnicas de respiración y relajación, exposición interoceptiva, exposición in vivo gradual.'},
      {id:TR[11],pacId:PA[11],psId:PS_RVARG,tipo:'Cognitivo-Conductual',sesiones:20,
       obs:'Baja autoestima crónica con patrones relacionales dependientes.',
       hipotesis:'Trastorno de personalidad por dependencia rasgos. Baja autoestima crónica.',
       diagnostico:'Problemas relacionales crónicos con baja autoestima.',
       objetivo:'Fortalecer autoestima. Identificar y cambiar patrones relacionales disfuncionales.',
       plan:'Trabajo en esquemas de vida, entrenamiento en asertividad, trabajo en límites, actividades de autocuidado.'},
      {id:TR[12],pacId:PA[12],psId:PS_MQUISP,tipo:'Entrevista Motivacional + TCC',sesiones:24,
       obs:'Dependencia alcohólica con historial de recaídas. Alta ambivalencia inicial al cambio.',
       hipotesis:'Dependencia alcohólica severa con patrón de recaída-recuperación.',
       diagnostico:'Dependencia al alcohol (CIE-11 6C40.2).',
       objetivo:'Alcanzar y mantener sobriedad. Construir red de apoyo. Prevenir recaídas.',
       plan:'Entrevista motivacional, psicoeducación sobre adicción, plan de prevención de recaídas, trabajo con familia.'},
      {id:TR[13],pacId:PA[13],psId:PS_MQUISP,tipo:'Entrevista Motivacional + TCC',sesiones:20,
       obs:'Dependencia a cannabis en estadio temprano de recuperación. Presión social significativa.',
       hipotesis:'Uso nocivo de cannabis con riesgo de dependencia.',
       diagnostico:'Uso perjudicial de cannabis (CIE-11 6C41.1).',
       objetivo:'Mantener abstinencia. Construir red social libre de consumo. Gestión del estrés sin sustancias.',
       plan:'Entrevista motivacional, técnicas HALT, reconstrucción red social, manejo del estrés alternativo.'},
      {id:TR[14],pacId:PA[14],psId:PS_JTORR,tipo:'TCC adaptada a adolescentes',sesiones:16,
       obs:'Depresión reactiva a bullying escolar persistente. Isolamiento social.',
       hipotesis:'Trastorno adaptativo con humor depresivo reactivo a bullying.',
       diagnostico:'Depresión reactiva en adolescente víctima de bullying.',
       objetivo:'Reducir síntomas depresivos. Construir red de apoyo escolar. Fortalecer autoestima.',
       plan:'Intervención en contexto escolar, entrenamiento en habilidades sociales, activación conductual, trabajo en autoestima.'},
      {id:TR[15],pacId:PA[15],psId:PS_JTORR,tipo:'TCC adaptada a adolescentes',sesiones:12,
       obs:'Ansiedad de evaluación con afectación del sueño y rendimiento.',
       hipotesis:'Ansiedad de rendimiento académico en adolescente con tendencia al perfeccionismo.',
       diagnostico:'Ansiedad de evaluación con componente perfeccionista.',
       objetivo:'Reducir ansiedad de evaluación. Mejorar tolerancia al error. Técnicas de relajación.',
       plan:'Psicoeducación sobre ansiedad, técnicas de respiración, reestructuración cognitiva, exposición gradual a evaluaciones.'},
      {id:TR[16],pacId:PA[16],psId:PS_JTORR,tipo:'Terapia de Aceptación y Compromiso (ACT)',sesiones:16,
       obs:'Crisis de identidad vocacional post abandono universitario. Baja motivación.',
       hipotesis:'Trastorno adaptativo con exploración de identidad en adulto joven.',
       diagnostico:'Trastorno de ajuste con humor depresivo.',
       objetivo:'Clarificar valores y metas. Reducir comparación social. Desarrollar plan de vida.',
       plan:'Clarificación de valores, defusión cognitiva, activación comprometida, exploración vocacional.'},
    ];

    for (const t of tratamientos) {
      await qr.query(`
        INSERT INTO historial_tratamiento
          (id, "pacienteId", "psicologoId", tipo_intervencion, numero_sesiones_tentativas,
           observaciones_clinicas_encrypted, hipotesis_diagnostica_encrypted,
           diagnostico_clinico_encrypted, objetivo_general_encrypted, plan_trabajo_encrypted,
           consumo_sustancias, fecha_inicio, activo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'2026-03-01',true)
      `, [
        t.id, t.pacId, t.psId, t.tipo, t.sesiones,
        enc(t.obs), enc(t.hipotesis), enc(t.diagnostico),
        enc(t.objetivo), enc(t.plan),
        [PA[5],PA[12]].includes(t.pacId),
      ]);
    }

    // ── 8. Historial Sesiones ───────────────────────────
    // Each patient gets one session per week (weeks 1-5)
    const sessionWeeks = [
      ["2026-03-03","2026-03-10"],
      ["2026-03-10","2026-03-17"],
      ["2026-03-17","2026-03-24"],
      ["2026-03-24","2026-03-31"],
      ["2026-03-31","2026-04-07"],
    ];

    for (let trIdx = 1; trIdx <= 16; trIdx++) {
      const paId = PA[trIdx];
      const trId = TR[trIdx];
      for (let wk = 0; wk < sessionWeeks.length; wk++) {
        const [fechaSesion, fechaProxima] = sessionWeeks[wk];
        const isLast = wk === sessionWeeks.length - 1;
        await qr.query(`
          INSERT INTO historial_sesion
            (id, "tratamientoId", fecha_sesion, fecha_proxima_sesion,
             seguimiento_encrypted, recomendaciones_encrypted,
             objetivos_proxima_sesion_encrypted, finalizada, fecha_finalizacion)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `, [
          randomUUID(), trId, fechaSesion, isLast ? null : fechaProxima,
          enc(`Sesión ${wk+1}: El paciente reporta avances respecto a la sesión anterior. Se trabajaron técnicas específicas del plan terapéutico. El paciente mostró disposición y colaboración durante la sesión.`),
          enc(`Continuar con práctica de técnicas aprendidas. Registrar situaciones difíciles en diario. Mantener rutinas de autocuidado.`),
          enc(isLast ? `Revisar avances del mes. Evaluar objetivos alcanzados. Planificar próxima fase del tratamiento.` : `Revisar práctica de esta semana. Introducir siguiente técnica. Trabajar situación reportada.`),
          !isLast,
          isLast ? null : `${fechaProxima}T18:00:00`,
        ]);
      }
    }

    // ── 9. Citas ────────────────────────────────────────
    // Past finalized + upcoming pending
    const citaWeeks = ["2026-03-03","2026-03-10","2026-03-17","2026-03-24","2026-03-31"];
    const citaFuture = ["2026-04-07","2026-04-14"];
    const consultorios = [C1, C2, C3];
    const psicologos = [PS_CMEND, PS_AFLOR, PS_RVARG, PS_MQUISP, PS_JTORR];
    // Group patients by psychologist
    const psiPacientes: Record<string, string[]> = {
      [PS_CMEND]: [PA[1],PA[2],PA[3],PA[4]],
      [PS_AFLOR]: [PA[5],PA[6],PA[7]],
      [PS_RVARG]: [PA[8],PA[9],PA[10],PA[11]],
      [PS_MQUISP]:[PA[12],PA[13]],
      [PS_JTORR]: [PA[14],PA[15],PA[16]],
    };

    const hours = ["09:00:00","10:00:00","11:00:00","14:00:00","15:00:00","16:00:00"];
    let hourIdx = 0;

    for (const psId of psicologos) {
      const pacs = psiPacientes[psId];
      for (const paId of pacs) {
        // Past sessions
        for (const fecha of citaWeeks) {
          const hora = hours[hourIdx % hours.length];
          hourIdx++;
          const cons = consultorios[hourIdx % consultorios.length];
          await qr.query(`
            INSERT INTO citas
              (id, "pacienteId", "psicologoId", "consultorioId",
               fecha_sesion, hora_sesion, duracion_minutos, tipo_cita,
               estado, solicitada_por, fecha_confirmacion)
            VALUES ($1,$2,$3,$4,$5,$6,60,'Sesión individual','finalizada','psicologo',now())
          `, [randomUUID(), paId, psId, cons, fecha, hora]);
        }
        // Upcoming (only first 2 patients per psychologist to keep it realistic)
        if (pacs.indexOf(paId) < 2) {
          for (const fecha of citaFuture) {
            const hora = hours[hourIdx % hours.length];
            hourIdx++;
            const cons = consultorios[hourIdx % consultorios.length];
            await qr.query(`
              INSERT INTO citas
                (id, "pacienteId", "psicologoId", "consultorioId",
                 fecha_sesion, hora_sesion, duracion_minutos, tipo_cita,
                 estado, solicitada_por)
              VALUES ($1,$2,$3,$4,$5,$6,60,'Sesión individual','activa','psicologo')
            `, [randomUUID(), paId, psId, cons, fecha, hora]);
          }
        }
      }
    }

    // ── 10. Diario Emocional + Análisis Sentimiento ─────
    for (const [pacId, entradas] of Object.entries(PATIENT_DIARIOS)) {
      for (const e of entradas) {
        const diarioId = randomUUID();
        await qr.query(`
          INSERT INTO diario_emocional
            (id, paciente_id, fecha_entrada, emocion_seleccionada, texto_entrada,
             estado_analisis, created_at)
          VALUES ($1,$2,$3,$4,$5,'analizado',$6)
        `, [diarioId, pacId, e.fecha, e.emocion, e.texto, `${e.fecha}T20:00:00`]);

        await qr.query(`
          INSERT INTO analisis_sentimiento
            (id, diario_emocional_id, paciente_id, fecha_analisis,
             sentimiento_general, confianza, score_positivo, score_negativo, score_neutral,
             emocion_predominante, palabras_clave, alertas, modelo_usado)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        `, [
          randomUUID(), diarioId, pacId, e.fecha,
          e.sentimiento, e.confianza, e.score_pos, e.score_neg, e.score_neu,
          e.emocion_predo,
          JSON.stringify(e.palabras),
          JSON.stringify(e.alertas),
          'pysentimiento/robertuito-sentiment-analysis',
        ]);
      }
    }

    // ── 11. Tareas Terapéuticas ─────────────────────────
    // Selected patients with therapeutic tasks
    const tareaData: Array<[string, string, string, string[], number, number]> = [
      [PA[1],'ejercicios_respiracion','2026-03-11',['Respiración 4-7-8 (3 series)','Respiración diafragmática'],3,900],
      [PA[1],'ejercicios_respiracion','2026-03-18',['Respiración 4-7-8 (5 series)','Respiración en situación real de estrés'],5,1500],
      [PA[1],'registro_actividades','2026-03-25',['Registro de pensamientos ansiosos','Registro de logros diarios'],7,1200],
      [PA[2],'higiene_sueno','2026-03-11',['Rutina de sueño fija','Sin pantallas 1h antes de dormir'],5,0],
      [PA[2],'registro_actividades','2026-03-18',['Activación conductual: caminata','Llamada a amiga'],3,1800],
      [PA[2],'ejercicios_gratitud','2026-03-25',['3 cosas por las que estar agradecida','Carta a mi yo del futuro'],7,600],
      [PA[3],'registro_actividades','2026-03-11',['Salida temprana del trabajo','Cena en familia'],2,0],
      [PA[3],'ejercicios_respiracion','2026-03-18',['Respiración al llegar del trabajo','Pausa activa en la oficina'],4,600],
      [PA[4],'registro_actividades','2026-03-11',['Conversación en cafetería','Pregunta en clase'],2,0],
      [PA[4],'registro_actividades','2026-03-25',['Participación voluntaria en clase','Estudio grupal'],5,0],
      [PA[8],'ejercicios_respiracion','2026-03-11',['Exposición puerta (5 revisiones)','Técnica STOP ante compulsión'],3,1200],
      [PA[8],'ejercicios_respiracion','2026-03-18',['Exposición puerta (3 revisiones)'],5,900],
      [PA[10],'ejercicios_respiracion','2026-03-11',['Respiración 4-7-8 antes de manejar','Manejo corto al supermercado'],3,1200],
      [PA[10],'ejercicios_respiracion','2026-03-18',['Manejo al trabajo solo','Respiración en autopista'],5,2400],
      [PA[12],'registro_actividades','2026-03-18',['Reunión de AA martes','Reunión de AA jueves','Ejercicio físico (craving)'],3,0],
      [PA[12],'registro_actividades','2026-03-25',['3 reuniones de AA','Llamada al sponsor','Partido de fútbol del hijo'],3,0],
      [PA[13],'registro_actividades','2026-03-11',['Salida al cine sin consumo','Activación social alternativa'],2,0],
      [PA[13],'registro_actividades','2026-03-25',['Celebración 1 mes de sobriedad','Red social libre de consumo'],4,0],
      [PA[14],'ejercicios_gratitud','2026-03-25',['Cosas positivas del día con Rodrigo','Logros sociales de la semana'],3,600],
      [PA[15],'ejercicios_respiracion','2026-03-11',['Respiración pre-examen','Técnica de calma en el aula'],3,900],
      [PA[15],'ejercicios_respiracion','2026-03-25',['Respiración antes de examen de Ciencias','Visualización positiva'],5,900],
    ];

    for (const [pacId, tipo, fecha, actividades, veces, tiempo] of tareaData) {
      await qr.query(`
        INSERT INTO registro_tareas_terapeuticas
          (id, paciente_id, tipo_tarea, fecha, actividades_realizadas,
           veces_completado, tiempo_total_segundos, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
      `, [
        randomUUID(), pacId, tipo, fecha,
        actividades.join(','), veces, tiempo, `${fecha}T21:00:00`,
      ]);
    }

    await qr.commitTransaction();
    console.log("\n✅ Seed completado exitosamente!\n");

    console.log("═══════════════════════════════════════════");
    console.log("  CREDENCIALES DE ACCESO");
    console.log("═══════════════════════════════════════════");
    console.log("  Usuario          │ Contraseña");
    console.log("  ─────────────────┼─────────────────────");
    console.log("  admin            │ Admin@2024!         (rol: admin)");
    console.log("  cmendoza         │ Mendoza@2024!       (Dr. Carlos Mendoza — 4 pacientes)");
    console.log("  aflores          │ Flores@2024!        (Dra. Ana Flores — 3 pacientes)");
    console.log("  rvargas          │ Vargas@2024!        (Dr. Roberto Vargas — 4 pacientes)");
    console.log("  mquispe          │ Quispe@2024!        (Dra. María Quispe — 2 pacientes)");
    console.log("  jtorres          │ Torres@2024!        (Dr. Javier Torres — 3 pacientes)");
    console.log("═══════════════════════════════════════════\n");

  } catch (err) {
    await qr.rollbackTransaction();
    console.error("❌ Seed fallido:", err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
