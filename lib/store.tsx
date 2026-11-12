"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Acta, Centro, Config, Db, Evidencia, Marca, Persona, Prueba, Rol, Toast, VersionPrueba } from "./types";
import type { Criterio, Metrica, UnidadId } from "./unidades";
import { crearPodio } from "./mock/podio";
import { crearKilo } from "./mock/kilo";
import { HOY, MIN, nombrePeriodo, periodoDe } from "./fecha";
import { actaDe, art, cap, firmar, puntuar, vigente, type Puntos } from "./calc";

// One in-memory API per instance. Each instance keeps its own records, the way each app keeps its
// own database in production: switching instance swaps the whole dataset, never mixes them.
// Every action answers after a short delay, like a request to the server.

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Estado {
  dbs: Record<string, Db>;
  orden: string[];
  activa: string;
  sesion: Record<string, string>;
  yo: Record<string, string>;
  toasts: Toast[];
  ultima?: { instancia: string; marcaId: string };
  pulso: { centroId: string; t: number } | null;
  seq: number;
}

export interface NuevaPrueba {
  nombre: string;
  descripcion: string;
  metrica: Metrica;
  unidad: UnidadId;
  criterio: Criterio;
  definicion: string;
  foto: string;
}
export interface NuevaVersion {
  metrica: Metrica;
  unidad: UnidadId;
  criterio: Criterio;
  definicion: string;
  motivo: string;
}
export interface NuevaMarca {
  pruebaId: string;
  valor: number;
  centroId: string;
  fecha: number;
  evidencia: Evidencia;
}

function inicial(): Estado {
  const podio = crearPodio();
  const kilo = crearKilo();
  return {
    dbs: { [podio.config.id]: podio, [kilo.config.id]: kilo },
    orden: [podio.config.id, kilo.config.id],
    activa: podio.config.id,
    sesion: { [podio.config.id]: "rafael-ortega", [kilo.config.id]: "coord-0" },
    yo: { [podio.config.id]: "lucia-romero", [kilo.config.id]: "ceip-azahar-0" },
    toasts: [],
    pulso: null,
    seq: 1,
  };
}

function useApi() {
  const [e, setE] = useState<Estado>(inicial);
  const t0 = useRef<number | null>(null);
  useEffect(() => {
    t0.current = Date.now();
  }, []);
  /** the clock: the fixed "today" of the data plus the time spent on the page */
  const ahora = useCallback(() => HOY + Math.max(0, Date.now() - (t0.current ?? Date.now())) + MIN, []);

  const db = e.dbs[e.activa];
  const v = db.config.vocab;
  const pts = useMemo(() => puntuar(db), [db]);
  const sesion = db.personas.find((p) => p.id === e.sesion[e.activa]) ?? db.personas.find((p) => p.rol === "admin")!;
  const yo = db.personas.find((p) => p.id === e.yo[e.activa]);

  // the active instance paints the whole site with its own colours
  useEffect(() => {
    const c = db.config.colores;
    const s = document.documentElement.style;
    s.setProperty("--accent", c.acento);
    s.setProperty("--accent-strong", c.acentoFuerte);
    s.setProperty("--accent-2", c.acento2);
    s.setProperty("--dark", c.oscuro);
    s.setProperty("--accent-soft", c.suave);
    document.documentElement.dataset.instancia = db.config.id;
  }, [db.config]);

  const toast = useCallback((texto: string, tom: Toast["tom"] = "ok") => {
    const id = Date.now() + Math.random();
    setE((x) => ({ ...x, toasts: [...x.toasts, { id, texto, tom }].slice(-3) }));
    setTimeout(() => setE((x) => ({ ...x, toasts: x.toasts.filter((t) => t.id !== id) })), 4600);
  }, []);

  const cambia = useCallback((id: string, fn: (d: Db) => Db) => setE((x) => ({ ...x, dbs: { ...x.dbs, [id]: fn(x.dbs[id]) } })), []);
  const nid = useRef(1);
  const novoId = (p: string) => `${p}${nid.current++}`;

  const subirMarca = async (n: NuevaMarca): Promise<Marca> => {
    await espera(900);
    const id = e.activa;
    const p = db.pruebas.find((x) => x.id === n.pruebaId)!;
    const m: Marca = { id: novoId("n"), personaId: yo!.id, pruebaId: n.pruebaId, version: vigente(p).v, valor: n.valor, centroId: n.centroId, fecha: n.fecha, subida: ahora(), estado: "provisional", evidencia: n.evidencia };
    cambia(id, (d) => ({ ...d, marcas: [m, ...d.marcas] }));
    setE((x) => ({ ...x, ultima: { instancia: id, marcaId: m.id } }));
    return m;
  };

  const verificar = async (marcaId: string) => {
    await espera(800);
    const m = db.marcas.find((x) => x.id === marcaId)!;
    if (sesion.centroId && sesion.centroId === m.centroId) throw new Error("propio");
    const nuevo: Db = { ...db, marcas: db.marcas.map((x) => (x.id === marcaId ? { ...x, estado: "verificada", verificadaPor: sesion.id, verificadaEl: ahora(), motivo: undefined } : x)) };
    const p = puntuar(nuevo).get(marcaId);
    cambia(e.activa, (d) => ({ ...d, marcas: d.marcas.map((x) => (x.id === marcaId ? { ...x, estado: "verificada", verificadaPor: sesion.id, verificadaEl: ahora(), motivo: undefined } : x)) }));
    const c = db.centros.find((x) => x.id === m.centroId);
    const per = periodoDe(m.fecha);
    const acta = actaDe(db, per);
    if (!c?.afiliado) toast(`${cap(v.marca.s)} ${v.marca.g === "f" ? "verificada" : "verificado"}. ${c?.nombre ?? "Ese lugar"} no está ${v.centro.g === "f" ? "afiliada" : "afiliado"}: queda en el historial, sin puntos de ranking.`, "info");
    else if (acta) toast(`${cap(v.marca.s)} ${v.marca.g === "f" ? "verificada" : "verificado"}. El acta de ${nombrePeriodo(per).toLowerCase()} ya está firmada: cuenta en el historial y en los récords, el acta no cambia.`, "info");
    else {
      toast(`${cap(v.marca.s)} ${v.marca.g === "f" ? "verificada" : "verificado"}: +${p?.puntos ?? 0} puntos para ${c.nombre} en ${nombrePeriodo(per).toLowerCase()}.`);
      setE((x) => ({ ...x, pulso: { centroId: c.id, t: Date.now() } }));
    }
    return p;
  };

  const rechazar = async (marcaId: string, motivo: string) => {
    await espera(700);
    cambia(e.activa, (d) => ({ ...d, marcas: d.marcas.map((x) => (x.id === marcaId ? { ...x, estado: "rechazada", verificadaPor: sesion.id, verificadaEl: ahora(), motivo } : x)) }));
    toast(`${cap(v.marca.s)} ${v.marca.g === "f" ? "rechazada" : "rechazado"}. Se avisa a quien la subió con el motivo.`, "alerta");
  };

  const crearPrueba = async (n: NuevaPrueba): Promise<Prueba> => {
    await espera(800);
    const base = n.nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const p: Prueba = { id: `${base}-${nid.current++}`, nombre: n.nombre, descripcion: n.descripcion, foto: n.foto, activa: true, creada: ahora(), versiones: [{ v: 1, metrica: n.metrica, unidad: n.unidad, criterio: n.criterio, definicion: n.definicion, escala: 1, desde: ahora() }] };
    cambia(e.activa, (d) => ({ ...d, pruebas: [...d.pruebas, p] }));
    toast(`${cap(v.prueba.s)} "${p.nombre}" ${v.prueba.g === "f" ? "creada" : "creado"}. Ya aparece en la app para subir ${v.marca.p}.`);
    return p;
  };

  const editarPrueba = async (id: string, cambios: { nombre: string; descripcion: string }) => {
    await espera(500);
    cambia(e.activa, (d) => ({ ...d, pruebas: d.pruebas.map((p) => (p.id === id ? { ...p, ...cambios } : p)) }));
    toast("Cambios guardados. Nombre y descripción no afectan a ninguna marca.");
  };

  const versionar = async (id: string, n: NuevaVersion): Promise<VersionPrueba> => {
    await espera(900);
    const p = db.pruebas.find((x) => x.id === id)!;
    const u = vigente(p);
    const mismaEscala = u.metrica === n.metrica && u.criterio === n.criterio && u.definicion.trim() === n.definicion.trim();
    const nv: VersionPrueba = { v: u.v + 1, metrica: n.metrica, unidad: n.unidad, criterio: n.criterio, definicion: n.definicion, escala: mismaEscala ? u.escala : u.escala + 1, desde: ahora(), motivo: n.motivo };
    cambia(e.activa, (d) => ({ ...d, pruebas: d.pruebas.map((x) => (x.id === id ? { ...x, versiones: [...x.versiones, nv] } : x)) }));
    toast(`Versión ${nv.v} de "${p.nombre}" activa. Las ${v.marca.p} anteriores siguen en la versión ${u.v}${mismaEscala ? " y los récords continúan" : ", con su propia tabla de récords"}.`);
    return nv;
  };

  const activarPrueba = (id: string, activa: boolean) => {
    cambia(e.activa, (d) => ({ ...d, pruebas: d.pruebas.map((p) => (p.id === id ? { ...p, activa } : p)) }));
    toast(activa ? "Vuelve a aparecer en la app." : `Oculta en la app. Sus ${v.marca.p} y récords se conservan.`, "info");
  };

  const crearCentro = async (n: { nombre: string; barrio: string; ciudad: string; afiliado: boolean; foto: string }): Promise<Centro> => {
    await espera(700);
    const c: Centro = { id: `c${nid.current++}`, ...n, ...(n.afiliado ? { afiliadoDesde: ahora() } : {}) };
    cambia(e.activa, (d) => ({ ...d, centros: [...d.centros, c] }));
    toast(`${cap(v.centro.s)} "${c.nombre}" dado de alta${c.afiliado ? " y compitiendo desde hoy" : ", sin competir en rankings"}.`);
    return c;
  };

  const afiliar = async (id: string, politica: "records" | "periodo") => {
    await espera(800);
    cambia(e.activa, (d) => ({ ...d, centros: d.centros.map((c) => (c.id === id ? { ...c, afiliado: true, afiliadoDesde: ahora(), politica } : c)) }));
    const c = db.centros.find((x) => x.id === id);
    toast(`${c?.nombre} ya compite. ${politica === "records" ? "Sus marcas anteriores entran en récords, no en el ranking del mes." : "Sus marcas de este mes también suman en el ranking en curso."}`);
  };

  const desafiliar = async (id: string) => {
    await espera(600);
    cambia(e.activa, (d) => ({ ...d, centros: d.centros.map((c) => (c.id === id ? { ...c, afiliado: false, afiliadoDesde: undefined, politica: undefined } : c)) }));
    toast("Deja de competir desde hoy. Las actas firmadas no cambian y las marcas siguen en cada historial.", "info");
  };

  const cambiarRol = (personaId: string, rol: Rol) => {
    cambia(e.activa, (d) => ({ ...d, personas: d.personas.map((p) => (p.id === personaId ? { ...p, rol } : p)) }));
    toast("Rol actualizado. Los permisos cambian en su próxima acción.", "info");
  };

  const mover = async (personaId: string, centroId: string) => {
    await espera(700);
    const t = ahora();
    cambia(e.activa, (d) => ({ ...d, personas: d.personas.map((p) => (p.id === personaId ? { ...p, centroId, historial: [...p.historial, { centroId, desde: t }] } : p)) }));
    const per = db.personas.find((p) => p.id === personaId);
    const antes = db.centros.find((c) => c.id === per?.centroId);
    const n = db.marcas.filter((m) => m.personaId === personaId && m.centroId === antes?.id).length;
    toast(`Hecho. ${n} ${n === 1 ? v.marca.s : v.marca.p} siguen sumando para ${antes?.nombre ?? "su centro anterior"}; desde hoy suma para ${db.centros.find((c) => c.id === centroId)?.nombre}.`);
  };

  const firmarActa = async (periodo: string): Promise<Acta> => {
    await espera(1100);
    const a = firmar(db, periodo, sesion.id, ahora());
    cambia(e.activa, (d) => ({ ...d, actas: [...d.actas.filter((x) => x.periodo !== periodo), firmar(d, periodo, sesion.id, ahora())] }));
    toast(`Acta de ${nombrePeriodo(periodo).toLowerCase()} firmada con ${a.totalMarcas} ${v.marca.p}. A partir de ahora esa tabla no se reescribe.`);
    return a;
  };

  const cambiarPlazo = (dias: number) => {
    cambia(e.activa, (d) => ({ ...d, config: { ...d.config, plazoDias: dias } }));
    toast(`Plazo de verificación: ${dias} días después de cada fin de mes.`, "info");
  };

  const crearInstancia = async (cfg: Config): Promise<string> => {
    const admin: Persona = { id: `${cfg.id}-admin`, nombre: "Administración", avatar: "av-m-1", rol: "admin", centroId: "", alta: ahora(), historial: [] };
    const nueva: Db = { config: { ...cfg, creada: ahora() }, centros: [], personas: [admin], pruebas: [], marcas: [], actas: [] };
    setE((x) => ({ ...x, dbs: { ...x.dbs, [cfg.id]: nueva }, orden: [...x.orden.filter((o) => o !== cfg.id), cfg.id], sesion: { ...x.sesion, [cfg.id]: admin.id } }));
    return cfg.id;
  };

  const fijarVersion = (id: string, version: string) => cambia(id, (d) => ({ ...d, config: { ...d.config, version } }));

  const cambiarInstancia = (id: string) => {
    setE((x) => ({ ...x, activa: id }));
    const c = e.dbs[id]?.config;
    if (c) toast(`Ahora estás en ${c.nombre}: base de datos propia (${c.bd}), mismo núcleo ${c.version}.`, "info");
  };

  const setSesion = (personaId: string) => setE((x) => ({ ...x, sesion: { ...x.sesion, [x.activa]: personaId } }));

  return {
    db, v, pts, sesion, yo, ahora,
    dbs: e.dbs, orden: e.orden, activa: e.activa, toasts: e.toasts, ultima: e.ultima, pulso: e.pulso,
    toast, subirMarca, verificar, rechazar, crearPrueba, editarPrueba, versionar, activarPrueba, crearCentro, afiliar, desafiliar,
    cambiarRol, mover, firmarActa, cambiarPlazo, crearInstancia, fijarVersion, cambiarInstancia, setSesion,
    art,
  };
}

export type Api = ReturnType<typeof useApi> & { pts: Map<string, Puntos> };
const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider ausente");
  return c;
}
