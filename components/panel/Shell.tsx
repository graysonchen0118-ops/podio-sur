"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Building, CalendarCheck, ChevronDown, Dumbbell, ExternalLink, Layers, Menu, Smartphone, Users, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Logo, SelectorInstancia } from "../Cabecera";
import { Avatar } from "../ui";
import { cap } from "@/lib/calc";
import { periodoDe } from "@/lib/fecha";
import type { Persona } from "@/lib/types";

export const rolTxt = (p: Persona, vf: string) => (p.rol === "admin" ? "Administración" : p.rol === "verificador" ? cap(vf) : "Usuario");

function Sesion() {
  const { db, v, sesion, setSesion } = useStore();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!abierto) return;
    const f = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAbierto(false);
    window.addEventListener("mousedown", f);
    return () => window.removeEventListener("mousedown", f);
  }, [abierto]);
  const opciones = db.personas.filter((p) => p.rol !== "usuario");
  const centro = (id: string) => db.centros.find((c) => c.id === id)?.nombre;
  return (
    <div className="sesion" ref={ref}>
      <button className="sesion-btn" onClick={() => setAbierto((x) => !x)} aria-expanded={abierto} aria-label="Cambiar de sesión">
        <Avatar chave={sesion.avatar} nome={sesion.nombre} size={32} />
        <span>
          <b>{sesion.nombre}</b>
          <small>
            {rolTxt(sesion, v.verificador.s)}
            {sesion.centroId ? ` · ${centro(sesion.centroId)}` : ""}
          </small>
        </span>
        <ChevronDown size={15} />
      </button>
      {abierto && (
        <div className="sesion-menu">
          <div className="instancia-menu-tit">Entrar como</div>
          {opciones.map((p) => (
            <button
              key={p.id}
              className={`sesion-op ${p.id === sesion.id ? "activa" : ""}`}
              onClick={() => {
                setSesion(p.id);
                setAbierto(false);
              }}
            >
              <Avatar chave={p.avatar} nome={p.nombre} size={28} />
              <span>
                <b>{p.nombre}</b>
                <small>
                  {rolTxt(p, v.verificador.s)}
                  {p.centroId ? ` · ${centro(p.centroId)}` : ""}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { db, v } = useStore();
  const ruta = usePathname();
  const [menu, setMenu] = useState(false);
  const firmados = new Set(db.actas.map((a) => a.periodo));
  const pendientes = db.marcas.filter((m) => m.estado === "provisional" && !firmados.has(periodoDe(m.fecha))).length;
  const items = [
    { href: "/panel/verificacion", txt: "Verificación", icono: <BadgeCheck size={18} />, badge: pendientes },
    { href: "/panel/pruebas", txt: cap(v.prueba.p), icono: <Dumbbell size={18} /> },
    { href: "/panel/centros", txt: cap(v.centro.p), icono: <Building size={18} /> },
    { href: "/panel/personas", txt: "Personas y roles", icono: <Users size={18} /> },
    { href: "/panel/periodos", txt: "Períodos y actas", icono: <CalendarCheck size={18} /> },
    { href: "/panel/instancias", txt: "Instancias", icono: <Layers size={18} /> },
  ];
  useEffect(() => setMenu(false), [ruta]);
  return (
    <div className="panel">
      <button className={`scrim ${menu ? "show" : ""}`} aria-label="Cerrar menú" onClick={() => setMenu(false)} />
      <aside className={`panel-lado ${menu ? "open" : ""}`}>
        <div className="panel-lado-cab">
          <Logo />
          <button className="icon-btn panel-cerrar" onClick={() => setMenu(false)} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>
        <SelectorInstancia oscuro />
        <nav className="panel-nav" aria-label="Panel">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={`panel-link ${ruta === i.href ? "activo" : ""}`}>
              {i.icono}
              <span>{i.txt}</span>
              {i.badge ? <em className="panel-badge">{i.badge}</em> : null}
            </Link>
          ))}
        </nav>
        <div className="panel-lado-pie">
          <Link href="/app" className="panel-link pequeno">
            <Smartphone size={16} /> <span>App de {v.persona.p}</span>
          </Link>
          <Link href="/" className="panel-link pequeno">
            <ExternalLink size={16} /> <span>Web pública</span>
          </Link>
        </div>
      </aside>
      <div className="panel-main main">
        <div className="panel-top">
          <button className="icon-btn panel-hamb" onClick={() => setMenu(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <span className="panel-top-bd">
            <i style={{ background: db.config.colores.acento }} /> {db.config.nombre} · base de datos {db.config.bd}
          </span>
          <Sesion />
        </div>
        <div className="panel-contenido">{children}</div>
      </div>
    </div>
  );
}

export function Cab({ titulo, sub, accion }: { titulo: string; sub?: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="panel-cab entra">
      <div>
        <h1>{titulo}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {accion && <div className="panel-cab-acc">{accion}</div>}
    </div>
  );
}

export const soloAdmin = "Solo administración puede hacerlo. Cambia de sesión arriba a la derecha.";
