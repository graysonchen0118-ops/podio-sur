import type { Centro, Config, Db, Persona, Prueba } from "../types";
import { elige, entre, semilla } from "../rand";
import { d, INICIO } from "../fecha";
import { firmarVencidos, generarMarcas, type PlanPersona } from "./generar";

// The second instance: the same core, its own configuration and its own database. Nothing in
// the code knows it is about recycling; only this configuration and these records do.

export const CONFIG_KILO: Config = {
  id: "kilo-verde",
  nombre: "Kilo Verde",
  lema: "Cada kilo cuenta para tu colegio.",
  sublema: "Cada clase registra lo que trae al punto limpio con una foto de la báscula, la coordinación de otro colegio lo verifica y el colegio sube en la clasificación del mes.",
  bd: "kilo_verde",
  servidor: "UE, Alemania",
  version: "1.4.0",
  creada: d(2026, 9, 2),
  colores: { acento: "#2f7a4f", acentoFuerte: "#205a39", acento2: "#a87a3d", oscuro: "#11241a", suave: "#e3f1e7" },
  vocab: {
    persona: { s: "clase", p: "clases", g: "f" },
    centro: { s: "colegio", p: "colegios", g: "m" },
    prueba: { s: "campaña", p: "campañas", g: "f" },
    marca: { s: "entrega", p: "entregas", g: "f" },
    verificador: { s: "coordinador", p: "coordinadores", g: "m" },
  },
  reglas: { puntosMarca: 10, puntosMejora: 5, puntosRecordCentro: 10 },
  plazoDias: 7,
  escena: "papel",
  copias: "Diarias, se guardan 30 días",
};

const C = (id: string, nombre: string, barrio: string, foto: string, afiliado = true): Centro => ({ id, nombre, barrio, ciudad: "Sevilla", foto, afiliado, ...(afiliado ? { afiliadoDesde: INICIO } : {}) });

const CENTROS: Centro[] = [
  C("ceip-azahar", "CEIP Azahar", "Triana", "rec-6"),
  C("ceip-giraldillo", "CEIP Giraldillo", "Nervión", "rec-7"),
  C("colegio-alcazar", "Colegio Alcázar", "Santa Cruz", "rec-8"),
  C("ies-rio-verde", "IES Río Verde", "Los Remedios", "rec-9"),
  C("ceip-golondrinas", "CEIP Las Golondrinas", "La Macarena", "rec-10"),
  C("colegio-patio", "Colegio Patio Andaluz", "Sevilla Este", "rec-5"),
  C("academia-lapiz", "Academia Lápiz", "Centro", "rec-4", false),
];

const PRUEBAS: Prueba[] = [
  { id: "papel", nombre: "Papel y cartón", descripcion: "Kilos que marca la báscula del punto limpio. Cajas plegadas, sin plástico.", foto: "rec-1", activa: true, creada: d(2026, 9, 3), versiones: [{ v: 1, metrica: "peso", unidad: "kg", criterio: "mayor", definicion: "Kilos por entrega", escala: 1, desde: INICIO }] },
  { id: "tapones", nombre: "Tapones de plástico", descripcion: "Tapones limpios en bolsa cerrada, pesados en el punto limpio.", foto: "rec-2", activa: true, creada: d(2026, 9, 3), versiones: [{ v: 1, metrica: "peso", unidad: "kg", criterio: "mayor", definicion: "Kilos por entrega", escala: 1, desde: INICIO }] },
  { id: "pilas", nombre: "Pilas usadas", descripcion: "Pilas contadas antes de entrar en el contenedor. Nunca sueltas en la mochila.", foto: "rec-3", activa: true, creada: d(2026, 9, 10), versiones: [{ v: 1, metrica: "cantidad", unidad: "ud", criterio: "mayor", definicion: "Unidades por entrega", escala: 1, desde: INICIO }] },
];

const CLASES = ["3.º A", "4.º B", "5.º A", "6.º C", "1.º ESO B", "2.º ESO A"];
const COORD: [string, "f" | "m", string][] = [["Ana Robles", "f", "ceip-azahar"], ["José Luis Parra", "m", "ies-rio-verde"], ["Mercedes Ortiz", "f", "ceip-golondrinas"], ["Tomás Herrero", "m", "colegio-patio"]];

export function crearKilo(): Db {
  const r = semilla(4417);
  const ps: Persona[] = [];
  let i = 0;
  for (const c of CENTROS) {
    const n = c.afiliado ? 3 + Math.floor(r() * 2) : 2;
    const clases = c.id.startsWith("ies") ? CLASES.slice(4) : CLASES.slice(0, 4);
    for (let k = 0; k < Math.min(n, clases.length); k++) {
      const alta = d(2026, 9, 8) + Math.floor(entre(r, 0, 12)) * 86_400_000;
      ps.push({ id: `${c.id}-${k}`, nombre: `${clases[k]} · ${c.nombre.replace(/^(CEIP|IES|Colegio|Academia) /, "")}`, avatar: `rec-${(i++ % 10) + 1}`, grupo: true, rol: "usuario", centroId: c.id, alta, historial: [{ centroId: c.id, desde: alta }] });
    }
  }
  COORD.forEach(([nombre, g, centroId], k) => ps.push({ id: `coord-${k}`, nombre, avatar: g === "f" ? `av-f-${20 - k}` : `av-m-${16 - k}`, rol: "verificador", centroId, alta: d(2026, 9, 2), historial: [{ centroId, desde: d(2026, 9, 2) }] }));
  ps.push({ id: "lola-medina", nombre: "Lola Medina", avatar: "av-f-22", rol: "admin", centroId: "", alta: d(2026, 9, 2), historial: [] });

  const db: Db = { config: CONFIG_KILO, centros: CENTROS.map((c) => ({ ...c })), personas: ps, pruebas: PRUEBAS.map((p) => ({ ...p })), marcas: [], actas: [] };
  const planes: PlanPersona[] = ps.filter((p) => p.rol === "usuario").map((persona) => ({ persona, pruebas: ["papel", "papel", "tapones", "pilas"], nivel: entre(r, 0.1, 0.9), cada: [6, 13] }));
  const { marcas } = generarMarcas(
    {
      r, instancia: CONFIG_KILO.id,
      valor: (id, l, k) => {
        const n = entre(r, -1, 1);
        if (id === "papel") return Math.round((26 - l * 21 + k * 3 + n * 2.5) * 10) * 100;
        if (id === "tapones") return Math.max(300, Math.round((3.6 - l * 3 + k * 0.4 + n * 0.3) * 10) * 100);
        return Math.max(6, Math.round(170 - l * 150 + k * 15 + n * 12));
      },
      version: () => 1,
      foto: (id) => (id === "papel" ? elige(r, ["rec-1", "rec-5", "rec-10"]) : id === "tapones" ? elige(r, ["rec-2", "rec-7"]) : elige(r, ["rec-3", "rec-4"])),
      verificadores: ps.filter((p) => p.rol === "verificador"), centrosNoAfiliados: ["academia-lapiz"], motivos: ["La báscula no se ve en la foto", "El código del día no aparece", "Subida en la campaña equivocada"], videoPct: 0.08,
    },
    db, planes, "k",
  );
  db.marcas = marcas.sort((a, b) => b.fecha - a.fecha);
  firmarVencidos(db, "lola-medina");
  return db;
}
