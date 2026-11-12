"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, Database, Layers, Medal, Menu, Recycle, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Config } from "@/lib/types";

export function IconoMarca({ c, size = 18 }: { c: Config; size?: number }) {
  return c.escena === "papel" ? <Recycle size={size} /> : c.escena === "libros" ? <BookOpen size={size} /> : <Medal size={size} />;
}

export function Logo({ compacto }: { compacto?: boolean }) {
  const { db } = useStore();
  return (
    <Link href="/" className="logo" aria-label={`${db.config.nombre}, inicio`}>
      <span className="logo-icono">
        <IconoMarca c={db.config} />
      </span>
      {!compacto && <span className="logo-nombre">{db.config.nombre}</span>}
    </Link>
  );
}

/** the instance switch: the same core opened on another app with its own database */
export function SelectorInstancia({ oscuro }: { oscuro?: boolean }) {
  const { dbs, orden, activa, cambiarInstancia } = useStore();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!abierto) return;
    const f = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAbierto(false);
    window.addEventListener("mousedown", f);
    return () => window.removeEventListener("mousedown", f);
  }, [abierto]);
  const c = dbs[activa].config;
  return (
    <div className={`instancia ${oscuro ? "instancia-oscura" : ""}`} ref={ref}>
      <button className="instancia-btn" onClick={() => setAbierto((x) => !x)} aria-expanded={abierto} aria-haspopup="listbox">
        <span className="instancia-punto" style={{ background: c.colores.acento }} />
        <span className="instancia-txt">
          <small>Instancia</small>
          <b>{c.nombre}</b>
        </span>
        <ChevronDown size={15} />
      </button>
      {abierto && (
        <div className="instancia-menu" role="listbox">
          <div className="instancia-menu-tit">Mismo núcleo, bases de datos separadas</div>
          {orden.map((id) => {
            const x = dbs[id].config;
            return (
              <button
                key={id}
                role="option"
                aria-selected={id === activa}
                className={`instancia-op ${id === activa ? "activa" : ""}`}
                onClick={() => {
                  setAbierto(false);
                  if (id !== activa) cambiarInstancia(id);
                }}
              >
                <span className="instancia-op-icono" style={{ background: x.colores.acento }}>
                  <IconoMarca c={x} size={15} />
                </span>
                <span>
                  <b>{x.nombre}</b>
                  <small>
                    <Database size={11} /> {x.bd} · núcleo {x.version}
                  </small>
                </span>
                {id === activa && <Check size={16} className="instancia-check" />}
              </button>
            );
          })}
          <Link href="/panel/instancias" className="instancia-ver" onClick={() => setAbierto(false)}>
            <Layers size={14} /> Ver y crear instancias
          </Link>
        </div>
      )}
    </div>
  );
}

export function Cabecera() {
  const { v } = useStore();
  const ruta = usePathname();
  const [menu, setMenu] = useState(false);
  const links = [
    { href: "/#clasificacion", txt: "Clasificación" },
    { href: "/#records", txt: "Récords" },
    { href: "/#como", txt: "Cómo funciona" },
  ];
  return (
    <header className="cabecera">
      <div className="cabecera-in">
        <Logo />
        <nav className={`cabecera-nav ${menu ? "abierta" : ""}`} aria-label="Principal">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenu(false)}>
              {l.txt}
            </a>
          ))}
          <Link href="/app" className={ruta === "/app" ? "activo" : ""} onClick={() => setMenu(false)}>
            App de {v.persona.p}
          </Link>
          <Link href="/panel/verificacion" className={ruta.startsWith("/panel") ? "activo" : ""} onClick={() => setMenu(false)}>
            Panel
          </Link>
        </nav>
        <div className="cabecera-der">
          <SelectorInstancia />
          <button className="icon-btn cabecera-menu" onClick={() => setMenu((x) => !x)} aria-label="Menú" aria-expanded={menu}>
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Pie() {
  const { db } = useStore();
  return (
    <footer className="pie">
      <div className="pie-in">
        <div className="pie-marca">
          <Logo />
          <p>{db.config.lema}</p>
        </div>
        <div className="pie-links">
          <a href="/#clasificacion">Clasificación</a>
          <a href="/#records">Récords</a>
          <a href="/#reglas">Reglas de puntuación</a>
          <Link href="/app">App</Link>
          <Link href="/panel/verificacion">Panel</Link>
        </div>
        <div className="pie-legal">
          <span>
            © 2026 {db.config.nombre}. Datos alojados en la {db.config.servidor.replace("UE, ", "UE (")}).
          </span>
          <span>Fotografías: Unsplash</span>
        </div>
      </div>
    </footer>
  );
}
