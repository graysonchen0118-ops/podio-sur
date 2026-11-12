"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ArrowDownUp, CheckCircle2, ChevronLeft, ChevronRight, Info, SearchX, TriangleAlert, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { foto } from "@/lib/photos";
import type { Estado } from "@/lib/types";

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tom}`}>
          {t.tom === "ok" ? <CheckCircle2 size={18} /> : t.tom === "erro" ? <TriangleAlert size={18} /> : t.tom === "alerta" ? <AlertTriangle size={18} /> : <Info size={18} />}
          <span>{t.texto}</span>
        </div>
      ))}
    </div>
  );
}

export function Foto({ chave, w, h, alt, className, eager, src }: { chave: string; w: number; h: number; alt: string; className?: string; eager?: boolean; src?: string }) {
  const [ok, setOk] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? foto(chave, w, h)}
      width={w}
      height={h}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`foto ${ok ? "foto-ok" : ""} ${className ?? ""}`}
      onLoad={() => setOk(true)}
    />
  );
}

export function Avatar({ chave, nome, size = 36, grupo, className }: { chave: string; nome: string; size?: number; grupo?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto(chave, size * 2, size * 2, !grupo)} width={size} height={size} alt={nome} className={`avatar ${grupo ? "avatar-grupo" : ""} ${className ?? ""}`} style={{ width: size, height: size }} loading="lazy" />
  );
}

/** inline skeleton, a span so it is safe inside text */
export function Skel({ h = 14, w = "100%", r = 8 }: { h?: number; w?: number | string; r?: number }) {
  return <span className="skel" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

/** tilts a passive card or photo in perspective under the pointer, with the light following.
 * Never wrap something people type or tap into: 3D transforms upset hit testing. */
export function Tilt({ children, className, max = 6 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
    el.style.setProperty("--lx", `${((x + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--ly", `${((y + 0.5) * 100).toFixed(0)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div ref={ref} className={`tilt ${className ?? ""}`} onPointerMove={move} onPointerLeave={leave}>
      {children}
      <span className="tilt-light" aria-hidden="true" />
    </div>
  );
}

function useMontagem(aberto: boolean, ms = 260) {
  const [montado, setMontado] = useState(aberto);
  useEffect(() => {
    if (aberto) setMontado(true);
    else {
      const t = setTimeout(() => setMontado(false), ms);
      return () => clearTimeout(t);
    }
  }, [aberto, ms]);
  return montado;
}

export function Modal({ aberto, titulo, onFechar, children, largura = 520, rodape }: { aberto: boolean; titulo: string; onFechar: () => void; children: React.ReactNode; largura?: number; rodape?: React.ReactNode }) {
  const montado = useMontagem(aberto);
  useEffect(() => {
    if (!aberto) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [aberto, onFechar]);
  if (!montado) return null;
  return createPortal(
    <div className={`modal-wrap ${aberto ? "show" : ""}`}>
      <button className="modal-scrim" aria-label="Cerrar" onClick={onFechar} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} style={{ maxWidth: largura }}>
        <div className="modal-head">
          <h3>{titulo}</h3>
          <button className="icon-btn" onClick={onFechar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {rodape && <div className="modal-foot">{rodape}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Gaveta({ aberto, titulo, sub, onFechar, children, rodape, largo }: { aberto: boolean; titulo: string; sub?: React.ReactNode; onFechar: () => void; children: React.ReactNode; rodape?: React.ReactNode; largo?: boolean }) {
  const montado = useMontagem(aberto, 320);
  useEffect(() => {
    if (!aberto) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [aberto, onFechar]);
  if (!montado) return null;
  return createPortal(
    <div className={`gaveta-wrap ${aberto ? "show" : ""}`}>
      <button className="gaveta-scrim" aria-label="Cerrar" onClick={onFechar} />
      <aside className={`gaveta ${largo ? "gaveta-larga" : ""}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="gaveta-head">
          <div>
            <h3>{titulo}</h3>
            {sub && <div className="gaveta-sub">{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onFechar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="gaveta-body">{children}</div>
        {rodape && <div className="gaveta-foot">{rodape}</div>}
      </aside>
    </div>,
    document.body,
  );
}

export function EstadoTag({ e, g = "f" }: { e: Estado; g?: "f" | "m" }) {
  const t = e === "verificada" ? (g === "f" ? "Verificada" : "Verificado") : e === "rechazada" ? (g === "f" ? "Rechazada" : "Rechazado") : "Provisional";
  return <span className={`tag tag-${e === "verificada" ? "ok" : e === "rechazada" ? "erro" : "alerta"}`}>{t}</span>;
}

export function Paginacion({ pagina, total, porPagina, onPagina }: { pagina: number; total: number; porPagina: number; onPagina: (p: number) => void }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (total <= porPagina) return <div className="paginacion"><span>{total} {total === 1 ? "registro" : "registros"}</span></div>;
  return (
    <div className="paginacion">
      <span>
        {(pagina - 1) * porPagina + 1} a {Math.min(total, pagina * porPagina)} de {total}
      </span>
      <div>
        <button className="icon-btn" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)} aria-label="Página anterior">
          <ChevronLeft size={18} />
        </button>
        <b>
          {pagina} / {paginas}
        </b>
        <button className="icon-btn" disabled={pagina >= paginas} onClick={() => onPagina(pagina + 1)} aria-label="Página siguiente">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export function Ordena<K extends string>({ campo, rotulo, orden, onOrden, className }: { campo: K; rotulo: string; orden: { campo: K; dir: 1 | -1 }; onOrden: (o: { campo: K; dir: 1 | -1 }) => void; className?: string }) {
  const activo = orden.campo === campo;
  return (
    <th className={className}>
      <button className={`ordena ${activo ? "activo" : ""}`} onClick={() => onOrden({ campo, dir: activo ? (orden.dir === 1 ? -1 : 1) : -1 })}>
        {rotulo} <ArrowDownUp size={12} />
      </button>
    </th>
  );
}

export function Vacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: React.ReactNode }) {
  return (
    <div className="vacio">
      <span className="vacio-icono">
        <SearchX size={22} />
      </span>
      <strong>{titulo}</strong>
      <p>{texto}</p>
      {accion}
    </div>
  );
}

export function Campo({ rotulo, error, children, ayuda }: { rotulo: string; error?: string; children: React.ReactNode; ayuda?: React.ReactNode }) {
  return (
    <label className={`campo ${error ? "campo-error" : ""}`}>
      <span className="campo-rotulo">{rotulo}</span>
      {children}
      {error ? <span className="campo-msg">{error}</span> : ayuda ? <span className="campo-ayuda">{ayuda}</span> : null}
    </label>
  );
}

/** a count that rolls up when the number changes */
export function Numero({ valor, formato = (v) => String(Math.round(v)) }: { valor: number; formato?: (v: number) => string }) {
  const [v, setV] = useState(valor);
  const de = useRef(valor);
  useEffect(() => {
    const ini = de.current;
    const t0 = performance.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 650);
      const e = 1 - Math.pow(1 - k, 3);
      setV(ini + (valor - ini) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else de.current = valor;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return <>{formato(v)}</>;
}

/** first paint shows skeletons for a moment, like a real API answering */
export function useCargando(ms = 650) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOk(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return !ok;
}

export function ListaSkel({ n = 5, h = 54 }: { n?: number; h?: number }) {
  return (
    <div className="lista-skel" aria-label="Cargando">
      {Array.from({ length: n }, (_, i) => (
        <Skel key={i} h={h} r={12} />
      ))}
    </div>
  );
}
