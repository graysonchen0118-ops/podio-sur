import type { Db, Estado, Marca, Persona, Prueba } from "../types";
import { elige, entre, entero } from "../rand";
import { DIA, HORA, HOY, MIN, periodosDesde, INICIO } from "../fecha";
import { codigoDia, estadoPeriodo, firmar } from "../calc";

// Shared by both instances: walks every person through the weeks since launch and writes the
// marks a real season would leave behind, with the statuses a verifier queue really has.

export interface PlanPersona {
  persona: Persona;
  pruebas: string[];
  nivel: number;
  cada: [number, number];
}

export interface Generador {
  r: () => number;
  instancia: string;
  valor: (pruebaId: string, nivel: number, progreso: number) => number;
  version: (p: Prueba, fecha: number) => number;
  foto: (pruebaId: string) => string;
  verificadores: Persona[];
  centrosNoAfiliados: string[];
  motivos: string[];
  videoPct: number;
}

const ID = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
const idVideo = (r: () => number) => Array.from({ length: 11 }, () => elige(r, ID.split(""))).join("");

export function hora(r: () => number, dia: number) {
  const dow = new Date(dia).getUTCDay();
  const h = dow === 6 || dow === 0 ? entero(r, 9, 13) : elige(r, [7, 8, 9, 13, 18, 19, 19, 20, 20, 21]);
  return dia + h * HORA + entero(r, 0, 11) * 5 * MIN;
}

export function estadoPara(r: () => number, fecha: number): { estado: Estado; pendiente: boolean } {
  const edad = (HOY - fecha) / DIA;
  const x = r();
  if (fecha < Date.UTC(2026, 9, 25)) return { estado: x < 0.86 ? "verificada" : x < 0.95 ? "provisional" : "rechazada", pendiente: false };
  if (fecha < Date.UTC(2026, 10, 1)) return { estado: x < 0.62 ? "verificada" : "provisional", pendiente: true };
  if (edad > 3) return { estado: x < 0.68 ? "verificada" : x < 0.95 ? "provisional" : "rechazada", pendiente: true };
  return { estado: x < 0.14 ? "verificada" : "provisional", pendiente: true };
}

export function generarMarcas(g: Generador, db: Pick<Db, "pruebas" | "centros">, planes: PlanPersona[], prefijo: string, desdeSeq = 1) {
  const marcas: Marca[] = [];
  let seq = desdeSeq;
  const pruebas = new Map(db.pruebas.map((p) => [p.id, p]));
  for (const pl of planes) {
    const per = pl.persona;
    let t = Math.max(INICIO, per.alta) + entero(g.r, 0, 4) * DIA;
    while (t < HOY - 2 * HORA) {
      const dia = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate());
      const fecha = Math.min(hora(g.r, dia), HOY - 40 * MIN);
      const pruebaId = elige(g.r, pl.pruebas);
      const p = pruebas.get(pruebaId)!;
      const progreso = (fecha - INICIO) / (HOY - INICIO);
      // a person trains where they belong, now and then somewhere that is not affiliated
      const enCasa = per.historial.filter((h) => h.desde <= fecha).pop()?.centroId ?? per.centroId;
      const centroId = g.centrosNoAfiliados.length && g.r() < 0.05 ? elige(g.r, g.centrosNoAfiliados) : enCasa;
      const { estado } = estadoPara(g.r, fecha);
      const video = g.r() < g.videoPct;
      const codigo = codigoDia(g.instancia, fecha);
      const otros = g.verificadores.filter((v) => v.centroId !== centroId);
      const verificadaEl = Math.min(HOY - 30 * MIN, fecha + entero(g.r, 4, 60) * HORA);
      marcas.push({
        id: `${prefijo}${seq++}`,
        personaId: per.id,
        pruebaId,
        version: g.version(p, fecha),
        valor: g.valor(pruebaId, pl.nivel, progreso + entre(g.r, -0.08, 0.08)),
        centroId,
        fecha,
        subida: fecha + entero(g.r, 2, 50) * MIN,
        estado,
        evidencia: video
          ? { tipo: "video", url: g.r() < 0.6 ? `https://youtu.be/${idVideo(g.r)}` : `https://www.instagram.com/reel/${idVideo(g.r)}`, codigo, codigoVisible: g.r() < 0.9 }
          : { tipo: "foto", foto: g.foto(pruebaId), codigo, codigoVisible: estado === "provisional" ? g.r() < 0.8 : true },
        ...(estado === "verificada" || estado === "rechazada" ? { verificadaPor: elige(g.r, otros.length ? otros : g.verificadores).id, verificadaEl } : {}),
        ...(estado === "rechazada" ? { motivo: elige(g.r, g.motivos) } : {}),
      });
      t = dia + entero(g.r, pl.cada[0], pl.cada[1]) * DIA;
    }
  }
  return { marcas, seq };
}

/** periods whose verification window already ended get their signed acta */
export function firmarVencidos(db: Db, por: string) {
  for (const p of periodosDesde(INICIO, HOY)) {
    if (estadoPeriodo(db, p) === "vencido") {
      const cuando = Date.UTC(Number(p.slice(0, 4)), Number(p.slice(5)), 1) + db.config.plazoDias * DIA + 9 * HORA;
      db.actas.push(firmar(db, p, por, cuando));
    }
  }
}
