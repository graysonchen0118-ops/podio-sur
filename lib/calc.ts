import type { Acta, Centro, Db, FilaRanking, Marca, Palabra, Prueba, VersionPrueba } from "./types";
import { mejor } from "./unidades";
import { DIA, HOY, finPeriodo, periodoDe, semanaDe } from "./fecha";

// Everything the screens show is derived here from the raw records, the way the real backend
// would compute it: points, rankings per period, records, streaks and the daily code.

export const vigente = (p: Prueba) => p.versiones[p.versiones.length - 1];
export const versionDe = (p: Prueba, v: number): VersionPrueba => p.versiones.find((x) => x.v === v) ?? vigente(p);

export interface Puntos {
  puntos: number;
  mejora: boolean;
  recordCentro: boolean;
}

/** points for every verified mark, walked in the order the marks were made */
export function puntuar(db: Db): Map<string, Puntos> {
  const r = db.config.reglas;
  const pruebas = new Map(db.pruebas.map((p) => [p.id, p]));
  const mejorPersona = new Map<string, number>();
  const mejorCentro = new Map<string, number>();
  const out = new Map<string, Puntos>();
  const lista = db.marcas.filter((m) => m.estado === "verificada").sort((a, b) => a.fecha - b.fecha || a.id.localeCompare(b.id));
  for (const m of lista) {
    const p = pruebas.get(m.pruebaId);
    if (!p) continue;
    const v = versionDe(p, m.version);
    const kp = `${m.personaId}|${p.id}|${v.escala}`;
    const kc = `${m.centroId}|${p.id}|${v.escala}`;
    const prevP = mejorPersona.get(kp);
    const prevC = mejorCentro.get(kc);
    const mejora = prevP !== undefined && mejor(m.valor, prevP, v.criterio);
    const recordCentro = prevC !== undefined && mejor(m.valor, prevC, v.criterio);
    if (prevP === undefined || mejor(m.valor, prevP, v.criterio)) mejorPersona.set(kp, m.valor);
    if (prevC === undefined || mejor(m.valor, prevC, v.criterio)) mejorCentro.set(kc, m.valor);
    out.set(m.id, { puntos: r.puntosMarca + (mejora ? r.puntosMejora : 0) + (recordCentro ? r.puntosRecordCentro : 0), mejora, recordCentro });
  }
  return out;
}

/** does this mark count in the official ranking of this period */
export function cuentaEnPeriodo(m: Marca, c: Centro | undefined, periodo: string) {
  if (!c || !c.afiliado || m.estado !== "verificada" || periodoDe(m.fecha) !== periodo) return false;
  if (c.afiliadoDesde && m.fecha < c.afiliadoDesde) return c.politica === "periodo" && periodoDe(c.afiliadoDesde) === periodo;
  return true;
}

export function rankingVivo(db: Db, periodo: string, pts = puntuar(db)): FilaRanking[] {
  const centros = new Map(db.centros.map((c) => [c.id, c]));
  const filas = new Map<string, { puntos: number; marcas: number; personas: Set<string> }>();
  for (const c of db.centros) if (c.afiliado) filas.set(c.id, { puntos: 0, marcas: 0, personas: new Set() });
  for (const m of db.marcas) {
    if (!cuentaEnPeriodo(m, centros.get(m.centroId), periodo)) continue;
    const f = filas.get(m.centroId);
    if (!f) continue;
    f.puntos += pts.get(m.id)?.puntos ?? 0;
    f.marcas += 1;
    f.personas.add(m.personaId);
  }
  return [...filas.entries()]
    .map(([centroId, f]) => ({ centroId, puntos: f.puntos, marcas: f.marcas, personas: f.personas.size }))
    .sort((a, b) => b.puntos - a.puntos || b.marcas - a.marcas || (centros.get(a.centroId)?.nombre ?? "").localeCompare(centros.get(b.centroId)?.nombre ?? ""));
}

export const actaDe = (db: Db, periodo: string) => db.actas.find((a) => a.periodo === periodo);
/** a signed period is read from its acta and never recomputed */
export const ranking = (db: Db, periodo: string, pts?: Map<string, Puntos>) => actaDe(db, periodo)?.ranking ?? rankingVivo(db, periodo, pts);

export const fechaFirma = (db: Db, periodo: string) => finPeriodo(periodo) + 1 + db.config.plazoDias * DIA;
export type EstadoPeriodo = "abierto" | "plazo" | "vencido" | "firmado";
export function estadoPeriodo(db: Db, periodo: string, ahora = HOY): EstadoPeriodo {
  if (actaDe(db, periodo)) return "firmado";
  if (ahora <= finPeriodo(periodo)) return "abierto";
  return ahora < fechaFirma(db, periodo) ? "plazo" : "vencido";
}

export function firmar(db: Db, periodo: string, por: string, cuando = HOY): Acta {
  const filas = rankingVivo(db, periodo);
  return { periodo, firmada: cuando, firmadaPor: por, ranking: filas, totalMarcas: filas.reduce((s, f) => s + f.marcas, 0) };
}

export interface Record_ {
  prueba: Prueba;
  version: VersionPrueba;
  marca: Marca;
  top: Marca[];
}
/** best verified mark per test and scale, only at centres that are affiliated now */
export function records(db: Db): Record_[] {
  const centros = new Map(db.centros.map((c) => [c.id, c]));
  const out: Record_[] = [];
  for (const p of db.pruebas) {
    const escalas = [...new Set(p.versiones.map((v) => v.escala))];
    for (const e of escalas) {
      const vs = p.versiones.filter((v) => v.escala === e);
      const ultima = vs[vs.length - 1];
      const nums = new Set(vs.map((v) => v.v));
      const ms = db.marcas.filter((m) => m.pruebaId === p.id && nums.has(m.version) && m.estado === "verificada" && centros.get(m.centroId)?.afiliado);
      if (!ms.length) continue;
      const ord = [...ms].sort((a, b) => (mejor(a.valor, b.valor, ultima.criterio) ? -1 : mejor(b.valor, a.valor, ultima.criterio) ? 1 : a.fecha - b.fecha));
      const vistos = new Set<string>();
      const top: Marca[] = [];
      for (const m of ord) {
        if (vistos.has(m.personaId)) continue;
        vistos.add(m.personaId);
        top.push(m);
        if (top.length === 5) break;
      }
      out.push({ prueba: p, version: ultima, marca: top[0], top });
    }
  }
  return out;
}

/** a person's best mark in a test, on the scale of its current version */
export function mejorPersonal(db: Db, personaId: string, pruebaId: string, soloVerificadas = false, excluir?: string) {
  const p = db.pruebas.find((x) => x.id === pruebaId);
  if (!p) return undefined;
  const v = vigente(p);
  const nums = new Set(p.versiones.filter((x) => x.escala === v.escala).map((x) => x.v));
  let best: Marca | undefined;
  for (const m of db.marcas) {
    if (m.personaId !== personaId || m.pruebaId !== pruebaId || !nums.has(m.version) || m.id === excluir) continue;
    if (m.estado === "rechazada" || (soloVerificadas && m.estado !== "verificada")) continue;
    if (!best || mejor(m.valor, best.valor, v.criterio)) best = m;
  }
  return best;
}

/** weekly participation streak: a week counts with at least one mark that was not rejected */
export function racha(db: Db, personaId: string, ahora = HOY) {
  const semanas = new Set(db.marcas.filter((m) => m.personaId === personaId && m.estado !== "rechazada").map((m) => semanaDe(m.fecha)));
  const esta = semanaDe(ahora);
  let w = semanas.has(esta) ? esta : esta - 7 * DIA;
  let actual = 0;
  while (semanas.has(w)) {
    actual++;
    w -= 7 * DIA;
  }
  const ultimas = Array.from({ length: 10 }, (_, i) => {
    const s = esta - (9 - i) * 7 * DIA;
    return { semana: s, activa: semanas.has(s), esta: s === esta };
  });
  const orden = [...semanas].sort((a, b) => a - b);
  let mejorR = 0;
  let run = 0;
  for (let i = 0; i < orden.length; i++) {
    run = i > 0 && orden[i] - orden[i - 1] === 7 * DIA ? run + 1 : 1;
    mejorR = Math.max(mejorR, run);
  }
  return { actual, ultimas, mejor: mejorR, estaSemana: semanas.has(esta) };
}

const LETRAS = "ABCDEFGHJKLMNPRSTUVWXYZ";
/** four letters that change every day, shown in the app and written beside the result in the photo */
export function codigoDia(instancia: string, t: number) {
  const dia = Math.floor(t / DIA);
  const s = `${instancia}:${dia}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = "";
  for (let i = 0; i < 4; i++) {
    h = Math.imul(h ^ (h >>> 13), 2246822507) >>> 0;
    out += LETRAS[h % LETRAS.length];
  }
  return out;
}

// small grammar helpers, so the same screens read right with other nouns
export const art = (p: Palabra) => (p.g === "f" ? "la" : "el");
export const arts = (p: Palabra) => (p.g === "f" ? "las" : "los");
export const un = (p: Palabra) => (p.g === "f" ? "una" : "un");
export const nuevo = (p: Palabra) => (p.g === "f" ? "Nueva" : "Nuevo");
export const nuevoMin = (p: Palabra) => (p.g === "f" ? "nueva" : "nuevo");
export const afiliadoTxt = (p: Palabra, si: boolean) => (si ? (p.g === "f" ? "afiliada" : "afiliado") : p.g === "f" ? "no afiliada" : "no afiliado");
export const verificadoTxt = (p: Palabra) => (p.g === "f" ? "verificada" : "verificado");
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
