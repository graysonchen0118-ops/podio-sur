// Every result is stored in a base unit (milliseconds, grams, millimetres, units, millilitres).
// A unit is only how a number is shown and typed, so any new test sorts with the same query.

export type Metrica = "tiempo" | "peso" | "distancia" | "repeticiones" | "cantidad" | "volumen";
export type UnidadId = "mmss" | "s" | "min" | "kg" | "lb" | "m" | "cm" | "rep" | "ud" | "L";
export type Criterio = "menor" | "mayor";

export const METRICAS: { id: Metrica; nombre: string; base: string }[] = [
  { id: "tiempo", nombre: "Tiempo", base: "milisegundos" },
  { id: "peso", nombre: "Peso", base: "gramos" },
  { id: "distancia", nombre: "Distancia", base: "milímetros" },
  { id: "repeticiones", nombre: "Repeticiones", base: "repeticiones" },
  { id: "cantidad", nombre: "Cantidad", base: "unidades" },
  { id: "volumen", nombre: "Volumen", base: "mililitros" },
];

/** Spanish number: decimal comma, thousands point only from 10.000 up */
export function num(n: number, dec = 0) {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(dec);
  const [ent, frac] = fixed.split(".");
  const conPuntos = ent.length > 4 ? ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ent;
  return `${neg ? "-" : ""}${conPuntos}${frac ? "," + frac : ""}`;
}
const limpia = (n: number, dec: number) => {
  const s = num(n, dec);
  return dec > 0 ? s.replace(/,?0+$/, "") : s;
};
const leeNumero = (s: string) => {
  const t = s.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
};

interface Unidad {
  id: UnidadId;
  metrica: Metrica;
  nombre: string;
  corto: string;
  ejemplo: string;
  /** base units per one displayed unit (tiempo mmss uses seconds) */
  factor: number;
  ver: (b: number) => string;
  leer: (s: string) => number | null;
}

const tiempoMmss = (ms: number) => {
  const dec = Math.round(ms / 100);
  const m = Math.floor(dec / 600);
  const s = Math.floor((dec % 600) / 10);
  const dd = dec % 10;
  return `${m}:${String(s).padStart(2, "0")},${dd}`;
};

export const UNIDADES: Record<UnidadId, Unidad> = {
  mmss: {
    id: "mmss", metrica: "tiempo", nombre: "minutos:segundos", corto: "m:ss,d", ejemplo: "1:34,8", factor: 1000,
    ver: tiempoMmss,
    leer: (s) => {
      const t = s.trim().replace(",", ".");
      const mm = /^(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/.exec(t);
      if (mm) return Math.round((Number(mm[1]) * 60 + Number(mm[2])) * 1000);
      const n = leeNumero(s);
      return n === null ? null : Math.round(n * 1000);
    },
  },
  s: { id: "s", metrica: "tiempo", nombre: "segundos", corto: "s", ejemplo: "94,8", factor: 1000, ver: (b) => `${limpia(b / 1000, 1)} s`, leer: (s) => { const n = leeNumero(s); return n === null ? null : Math.round(n * 1000); } },
  min: { id: "min", metrica: "tiempo", nombre: "minutos", corto: "min", ejemplo: "1,58", factor: 60000, ver: (b) => `${num(b / 60000, 2)} min`, leer: (s) => { const n = leeNumero(s); return n === null ? null : Math.round(n * 60000); } },
  kg: { id: "kg", metrica: "peso", nombre: "kilos", corto: "kg", ejemplo: "102,5", factor: 1000, ver: (b) => `${limpia(b / 1000, 1)} kg`, leer: (s) => { const n = leeNumero(s); return n === null ? null : Math.round(n * 1000); } },
  lb: { id: "lb", metrica: "peso", nombre: "libras", corto: "lb", ejemplo: "225", factor: 453.592, ver: (b) => `${num(b / 453.592, 0)} lb`, leer: (s) => { const n = leeNumero(s); return n === null ? null : Math.round(n * 453.592); } },
  m: { id: "m", metrica: "distancia", nombre: "metros", corto: "m", ejemplo: "2,41", factor: 1000, ver: (b) => `${num(b / 1000, 2)} m`, leer: (s) => { const n = leeNumero(s); return n === null ? null : Math.round(n * 1000); } },
  cm: { id: "cm", metrica: "distancia", nombre: "centímetros", corto: "cm", ejemplo: "241", factor: 10, ver: (b) => `${num(b / 10, 0)} cm`, leer: (s) => { const n = leeNumero(s); return n === null ? null : Math.round(n * 10); } },
  rep: { id: "rep", metrica: "repeticiones", nombre: "repeticiones", corto: "rep.", ejemplo: "24", factor: 1, ver: (b) => `${num(b, 0)} rep.`, leer: (s) => { const n = leeNumero(s); return n === null || !Number.isInteger(n) ? null : n; } },
  ud: { id: "ud", metrica: "cantidad", nombre: "unidades", corto: "ud.", ejemplo: "140", factor: 1, ver: (b) => `${num(b, 0)} ud.`, leer: (s) => { const n = leeNumero(s); return n === null || !Number.isInteger(n) ? null : n; } },
  L: { id: "L", metrica: "volumen", nombre: "litros", corto: "L", ejemplo: "4,5", factor: 1000, ver: (b) => `${limpia(b / 1000, 1)} L`, leer: (s) => { const n = leeNumero(s); return n === null ? null : Math.round(n * 1000); } },
};

export const unidadesDe = (m: Metrica) => Object.values(UNIDADES).filter((u) => u.metrica === m);
export const ver = (b: number, u: UnidadId) => UNIDADES[u].ver(b);
export const leer = (s: string, u: UnidadId) => UNIDADES[u].leer(s);
export const criterioTexto = (c: Criterio) => (c === "menor" ? "Gana el valor más bajo" : "Gana el valor más alto");
export const criterioCorto = (c: Criterio) => (c === "menor" ? "menor gana" : "mayor gana");
/** a beats b under criterion c */
export const mejor = (a: number, b: number, c: Criterio) => (c === "menor" ? a < b : a > b);

/** what a raw, unit-less number turns into if a test's unit is edited in place: the trap of storing
 * the typed number instead of a base value */
export function lecturaIngenua(b: number, de: UnidadId, a: UnidadId) {
  const crudo = b / UNIDADES[de].factor;
  return UNIDADES[a].ver(Math.round(crudo * UNIDADES[a].factor));
}
