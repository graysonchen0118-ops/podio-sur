import type { Centro, Config, Db, Marca, Persona, Prueba } from "../types";
import { elige, entre, semilla } from "../rand";
import { d, HOY, INICIO } from "../fecha";
import { codigoDia } from "../calc";
import { firmarVencidos, generarMarcas, type PlanPersona } from "./generar";

export const CONFIG_PODIO: Config = {
  id: "podio-sur",
  nombre: "Podio Sur",
  lema: "Tu marca suma para tu centro.",
  sublema: "Registras tu resultado con foto o vídeo, alguien de otro centro lo verifica y el centro donde lo hiciste sube en la clasificación del mes. Tu historial y tus récords se quedan contigo aunque cambies de centro.",
  bd: "podio_sur",
  servidor: "UE, Alemania",
  version: "1.4.0",
  creada: d(2026, 8, 18),
  colores: { acento: "#c4632b", acentoFuerte: "#9a4718", acento2: "#1f3a5f", oscuro: "#111827", suave: "#fbeee3" },
  vocab: {
    persona: { s: "deportista", p: "deportistas", g: "m" },
    centro: { s: "centro", p: "centros", g: "m" },
    prueba: { s: "prueba", p: "pruebas", g: "f" },
    marca: { s: "marca", p: "marcas", g: "f" },
    verificador: { s: "verificador", p: "verificadores", g: "m" },
  },
  reglas: { puntosMarca: 10, puntosMejora: 5, puntosRecordCentro: 10 },
  plazoDias: 15,
  escena: "discos",
  copias: "Diarias, se guardan 30 días",
};

const C = (id: string, nombre: string, barrio: string, foto: string, afiliado = true, ciudad = "Sevilla"): Centro => ({ id, nombre, barrio, ciudad, foto, afiliado, ...(afiliado ? { afiliadoDesde: INICIO } : {}) });

const CENTROS: Centro[] = [
  C("box-la-cava", "Box La Cava", "Triana", "gym-1"),
  C("fuerza-nervion", "Fuerza Nervión", "Nervión", "gym-2"),
  C("estudio-alameda", "Estudio Alameda", "Alameda", "gym-3"),
  C("macarena-training", "Macarena Training", "La Macarena", "gym-4"),
  C("club-los-remedios", "Club Los Remedios", "Los Remedios", "gym-5"),
  C("bermejales-box", "Bermejales Box", "Los Bermejales", "gym-6"),
  C("cartuja-fit", "Cartuja Fit", "La Cartuja", "gym-7"),
  C("aljarafe-sport", "Aljarafe Sport", "Mairena del Aljarafe", "gym-8", true, "Mairena del Aljarafe"),
  C("box-dos-hermanas", "Box Dos Hermanas", "Montequinto", "gym-9", true, "Dos Hermanas"),
  C("tomares-fuerza", "Tomares Fuerza", "Tomares", "gym-10", true, "Tomares"),
  C("sevilla-este-gym", "Sevilla Este Gym", "Sevilla Este", "gym-11"),
  C("club-pino-montano", "Club Pino Montano", "Pino Montano", "gym-12"),
  C("gimnasio-avenida", "Gimnasio Avenida", "Centro", "hero-2", false),
  C("box-utrera", "Box Utrera", "Utrera", "hero-3", false, "Utrera"),
  C("hotel-malaga", "Gimnasio de hotel", "Paseo marítimo", "hero-4", false, "Málaga"),
];

const v1 = (metrica: Prueba["versiones"][0]["metrica"], unidad: Prueba["versiones"][0]["unidad"], criterio: "menor" | "mayor", definicion: string) => ({ v: 1, metrica, unidad, criterio, definicion, escala: 1, desde: INICIO });

const PRUEBAS: Prueba[] = [
  { id: "remo-500", nombre: "Remo 500 m", descripcion: "500 metros en remoergómetro, resistencia libre. Foto del monitor nada más terminar.", foto: "ev-remo-1", activa: true, creada: d(2026, 8, 20), versiones: [v1("tiempo", "s", "menor", "500 m en remoergómetro")] },
  { id: "sentadilla-1rm", nombre: "Sentadilla trasera 1RM", descripcion: "Una repetición con el máximo peso, profundidad por debajo de la paralela.", foto: "ev-sentadilla-1", activa: true, creada: d(2026, 8, 20), versiones: [v1("peso", "kg", "mayor", "Una repetición, barra olímpica")] },
  { id: "dominadas-1min", nombre: "Dominadas en 1 minuto", descripcion: "Barbilla por encima de la barra, brazos estirados abajo. Sin balanceo.", foto: "ev-dominadas-1", activa: true, creada: d(2026, 8, 20), versiones: [v1("repeticiones", "rep", "mayor", "60 segundos, agarre libre")] },
  {
    id: "salto-horizontal", nombre: "Salto horizontal", descripcion: "Salto a pies juntos desde parado. Se mide al talón más cercano.", foto: "ev-salto-1", activa: true, creada: d(2026, 8, 20),
    versiones: [v1("distancia", "cm", "mayor", "Pies juntos, desde parado"), { v: 2, metrica: "distancia", unidad: "m", criterio: "mayor", definicion: "Pies juntos, desde parado", escala: 1, desde: d(2026, 10, 1), motivo: "Los centros pedían metros con dos decimales. Misma medida, otra forma de escribirla: los récords siguen." }],
  },
  { id: "carrera-1km", nombre: "Carrera 1 km en cinta", descripcion: "Cinta al 1 % de inclinación. Foto de la pantalla con el kilómetro marcado.", foto: "ev-carrera-1", activa: true, creada: d(2026, 8, 20), versiones: [v1("tiempo", "mmss", "menor", "1 km, cinta al 1 %")] },
  { id: "plancha", nombre: "Plancha abdominal", descripcion: "Antebrazos y puntas de los pies. Se para el tiempo cuando la cadera cae.", foto: "ev-plancha-1", activa: true, creada: d(2026, 8, 22), versiones: [v1("tiempo", "mmss", "mayor", "Plancha frontal sobre antebrazos")] },
  { id: "burpees-3min", nombre: "Burpees en 3 minutos", descripcion: "Pecho al suelo y salto con palmada arriba. Cuenta un compañero.", foto: "ev-plancha-2", activa: true, creada: d(2026, 8, 25), versiones: [v1("repeticiones", "rep", "mayor", "180 segundos")] },
];

// [name, gender, centre]
const DEPORTISTAS: [string, "f" | "m", string][] = [
  ["Daniel Morales", "m", "box-la-cava"], ["Paula Ruiz", "f", "box-la-cava"], ["Sergio Castillo", "m", "box-la-cava"], ["Marina Delgado", "f", "box-la-cava"],
  ["Adrián Molina", "m", "fuerza-nervion"], ["Claudia Herrera", "f", "fuerza-nervion"], ["Rubén Márquez", "m", "fuerza-nervion"],
  ["Nerea Campos", "f", "estudio-alameda"], ["Iván Rubio", "m", "estudio-alameda"], ["Rocío Benítez", "f", "estudio-alameda"],
  ["Manuel Reyes", "m", "macarena-training"], ["Alba Cano", "f", "macarena-training"], ["David Ramos", "m", "macarena-training"], ["Sara Gallego", "f", "macarena-training"],
  ["Hugo Pastor", "m", "club-los-remedios"], ["Irene Flores", "f", "club-los-remedios"], ["Jorge Méndez", "m", "club-los-remedios"],
  ["Lorena Vega", "f", "bermejales-box"], ["Antonio Cabello", "m", "bermejales-box"], ["Cristina Lozano", "f", "bermejales-box"],
  ["Mario Fuentes", "m", "cartuja-fit"], ["Noelia Sanz", "f", "cartuja-fit"], ["Óscar Iglesias", "m", "cartuja-fit"],
  ["Beatriz Calvo", "f", "aljarafe-sport"], ["Raúl Guerrero", "m", "aljarafe-sport"], ["Celia Domínguez", "f", "aljarafe-sport"], ["Diego Arias", "m", "aljarafe-sport"],
  ["Patricia León", "f", "box-dos-hermanas"], ["Fernando Nieto", "m", "box-dos-hermanas"], ["Andrea Medina", "f", "box-dos-hermanas"],
  ["Alejandro Peña", "m", "tomares-fuerza"], ["Silvia Carmona", "f", "tomares-fuerza"],
  ["Víctor Santana", "m", "sevilla-este-gym"], ["Laura Pineda", "f", "sevilla-este-gym"], ["Gonzalo Moya", "m", "sevilla-este-gym"],
  ["Esther Rivas", "f", "club-pino-montano"], ["Pedro Lara", "m", "club-pino-montano"], ["Natalia Bravo", "f", "club-pino-montano"],
  ["Julia Aguilar", "f", "fuerza-nervion"], ["Carlos Vera", "m", "estudio-alameda"],
];

const VERIFICADORES: [string, "f" | "m", string][] = [
  ["Marta Gil", "f", "box-la-cava"], ["Rafael Ortega", "m", "fuerza-nervion"], ["Inés Navarro", "f", "estudio-alameda"],
  ["Álvaro Díaz", "m", "cartuja-fit"], ["Carmen Vidal", "f", "aljarafe-sport"], ["Pablo Serrano", "m", "macarena-training"],
];

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, "-");

function personas(r: () => number) {
  // the faces seen most (Lucía, the verifiers, the admin) are unique; only athletes repeat on the wrap
  let f = 1;
  let m = 1;
  const avatar = (g: "f" | "m") => {
    if (g === "f") {
      const n = f++;
      return `av-f-${n <= 22 ? n : 6 + ((n - 23) % 17)}`;
    }
    const n = m++;
    return `av-m-${n <= 18 ? n : 4 + ((n - 19) % 15)}`;
  };
  const out: Persona[] = [];
  out.push({ id: "lucia-romero", nombre: "Lucía Romero", avatar: avatar("f"), rol: "usuario", centroId: "fuerza-nervion", alta: d(2026, 9, 1), historial: [{ centroId: "box-la-cava", desde: d(2026, 9, 1) }, { centroId: "fuerza-nervion", desde: d(2026, 10, 6) }] });
  const staff: Persona[] = [];
  for (const [nombre, g, centroId] of VERIFICADORES) staff.push({ id: slug(nombre), nombre, avatar: avatar(g), rol: "verificador", centroId, alta: d(2026, 8, 28), historial: [{ centroId, desde: d(2026, 8, 28) }] });
  staff.push({ id: "elena-prieto", nombre: "Elena Prieto", avatar: avatar("f"), rol: "admin", centroId: "", alta: d(2026, 8, 18), historial: [] });
  for (const [nombre, g, centroId] of DEPORTISTAS) {
    const alta = d(2026, 9, 1) + Math.floor(entre(r, 0, 24)) * 86_400_000;
    out.push({ id: slug(nombre), nombre, avatar: avatar(g), rol: "usuario", centroId, alta, historial: [{ centroId, desde: alta }] });
  }
  return [...out, ...staff];
}

const r1 = (x: number, paso: number) => Math.round(x / paso) * paso;
function valor(r: () => number) {
  return (id: string, l: number, k: number) => {
    const n = () => entre(r, -1, 1);
    switch (id) {
      case "remo-500": return r1((86 + l * 42 - k * 3.2 + n() * 1.4) * 1000, 100);
      case "sentadilla-1rm": return r1((172 - l * 118 + k * 8 + n() * 2.5) * 1000, 2500);
      case "dominadas-1min": return Math.max(2, Math.round(31 - l * 26 + k * 3 + n() * 1.5));
      case "salto-horizontal": return r1((2.74 - l * 1.02 + k * 0.06 + n() * 0.03) * 1000, 10);
      case "carrera-1km": return r1((188 + l * 150 - k * 8 + n() * 3) * 1000, 100);
      case "plancha": return r1((70 + (1 - l) * 280 + k * 25 + n() * 8) * 1000, 1000);
      default: return Math.max(20, Math.round(77 - l * 40 + k * 4 + n() * 2));
    }
  };
}

const FOTOS_EV: Record<string, string[]> = {
  "remo-500": ["ev-remo-1", "ev-remo-2", "ev-remo-3", "ev-remo-4"],
  "sentadilla-1rm": ["ev-sentadilla-1", "ev-sentadilla-2", "ev-sentadilla-3"],
  "dominadas-1min": ["ev-dominadas-1", "ev-dominadas-2"],
  "salto-horizontal": ["ev-salto-1", "ev-salto-2"],
  "carrera-1km": ["ev-carrera-1", "ev-carrera-2"],
  plancha: ["ev-plancha-1", "ev-plancha-2"],
  "burpees-3min": ["ev-plancha-2", "ev-plancha-1"],
};

const MOTIVOS = ["El código del día no aparece en la foto", "La foto no deja ver el resultado", "Subida en la prueba equivocada", "El vídeo no muestra la repetición completa"];

/** Lucía is the person the app opens as: a season written by hand, two centres and a holiday */
function marcasLucia(): Marca[] {
  const inst = CONFIG_PODIO.id;
  const m = (id: string, pruebaId: string, valor: number, centroId: string, fecha: number, estado: Marca["estado"], extra: Partial<Marca> = {}, video = false): Marca => ({
    id, personaId: "lucia-romero", pruebaId, version: 1, valor, centroId, fecha, subida: fecha + 9 * 60_000, estado,
    evidencia: video ? { tipo: "video", url: "https://youtu.be/Lr4qT9mWc2x", codigo: codigoDia(inst, fecha), codigoVisible: true } : { tipo: "foto", foto: FOTOS_EV[pruebaId][0], codigo: codigoDia(inst, fecha), codigoVisible: true },
    ...(estado !== "provisional" ? { verificadaPor: centroId === "box-la-cava" ? "rafael-ortega" : "marta-gil", verificadaEl: fecha + 20 * 3_600_000 } : {}),
    ...extra,
  });
  return [
    m("lu1", "remo-500", 101200, "box-la-cava", d(2026, 9, 3, 19, 20), "verificada"),
    m("lu2", "sentadilla-1rm", 72500, "box-la-cava", d(2026, 9, 9, 20, 5), "verificada"),
    m("lu3", "plancha", 130000, "box-la-cava", d(2026, 9, 15, 19, 40), "verificada"),
    m("lu4", "remo-500", 99800, "hotel-malaga", d(2026, 9, 19, 9, 15), "verificada", {}, true),
    m("lu5", "remo-500", 100100, "box-la-cava", d(2026, 9, 24, 19, 10), "verificada"),
    m("lu6", "sentadilla-1rm", 75000, "box-la-cava", d(2026, 9, 30, 20, 30), "verificada"),
    m("lu7", "plancha", 144000, "box-la-cava", d(2026, 10, 2, 19, 0), "verificada"),
    m("lu8", "remo-500", 98600, "fuerza-nervion", d(2026, 10, 9, 8, 20), "verificada"),
    m("lu9", "sentadilla-1rm", 77500, "fuerza-nervion", d(2026, 10, 16, 20, 15), "verificada"),
    m("lu10", "plancha", 151000, "fuerza-nervion", d(2026, 10, 22, 19, 35), "provisional"),
    m("lu11", "remo-500", 97900, "fuerza-nervion", d(2026, 10, 29, 8, 5), "provisional"),
    m("lu12", "sentadilla-1rm", 80000, "fuerza-nervion", d(2026, 11, 4, 20, 10), "verificada"),
    m("lu13", "remo-500", 96400, "fuerza-nervion", d(2026, 11, 10, 8, 30), "verificada"),
    m("lu14", "plancha", 160000, "fuerza-nervion", d(2026, 11, 12, 19, 50), "provisional"),
  ];
}

export function crearPodio(): Db {
  const r = semilla(20261109);
  const ps = personas(r);
  const db: Db = { config: CONFIG_PODIO, centros: CENTROS.map((c) => ({ ...c })), personas: ps, pruebas: PRUEBAS.map((p) => ({ ...p, versiones: p.versiones.map((v) => ({ ...v })) })), marcas: [], actas: [] };
  const verificadores = ps.filter((p) => p.rol === "verificador");
  const planes: PlanPersona[] = ps
    .filter((p) => p.rol === "usuario" && p.id !== "lucia-romero")
    .map((persona) => {
      const todas = ["remo-500", "remo-500", "sentadilla-1rm", "dominadas-1min", "carrera-1km", "plancha", "burpees-3min", "salto-horizontal"];
      const n = 2 + Math.floor(r() * 3);
      const pruebas = [...new Set(Array.from({ length: n + 1 }, () => elige(r, todas)))];
      return { persona, pruebas, nivel: entre(r, 0.05, 0.95), cada: [4, 11] as [number, number] };
    });
  const { marcas } = generarMarcas(
    {
      r, instancia: CONFIG_PODIO.id, valor: valor(r),
      version: (p, fecha) => [...p.versiones].reverse().find((v) => v.desde <= fecha)?.v ?? 1,
      foto: (id) => elige(r, FOTOS_EV[id]),
      verificadores, centrosNoAfiliados: ["gimnasio-avenida", "box-utrera"], motivos: MOTIVOS, videoPct: 0.2,
    },
    db, planes, "m",
  );
  db.marcas = [...marcasLucia(), ...marcas].sort((a, b) => b.fecha - a.fecha);
  firmarVencidos(db, "elena-prieto");
  return db;
}

export const HOY_PODIO = HOY;
