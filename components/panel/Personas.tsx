"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Flame, MapPin, RotateCcw, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cab, rolTxt, soloAdmin } from "./Shell";
import { Avatar, Campo, ListaSkel, Modal, Paginacion, Spinner, Vacio, useCargando } from "../ui";
import type { Persona, Rol } from "@/lib/types";
import { fechaCorta } from "@/lib/fecha";
import { cap, racha } from "@/lib/calc";

type Filtro = "todos" | Rol;
const POR = 12;

export default function Personas() {
  const { db, v, sesion, cambiarRol } = useStore();
  const cargando = useCargando(550);
  const admin = sesion.rol === "admin";
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mover, setMover] = useState<Persona | null>(null);
  const centros = useMemo(() => new Map(db.centros.map((c) => [c.id, c])), [db.centros]);
  const cuenta = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of db.marcas) m.set(x.personaId, (m.get(x.personaId) ?? 0) + 1);
    return m;
  }, [db.marcas]);
  const lista = db.personas
    .filter((p) => filtro === "todos" || p.rol === filtro)
    .filter((p) => !busca.trim() || `${p.nombre} ${centros.get(p.centroId)?.nombre ?? ""}`.toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) => (a.rol === b.rol ? a.nombre.localeCompare(b.nombre) : a.rol === "admin" ? -1 : b.rol === "admin" ? 1 : a.rol === "verificador" ? -1 : 1));

  return (
    <>
      <Cab titulo="Personas y roles" sub={`Tres roles: usuario sube ${v.marca.p}, ${v.verificador.s} revisa evidencias de otros ${v.centro.p} y administración gestiona ${v.prueba.p}, ${v.centro.p} y actas.`} />
      <div className="tabla-card entra d1">
        <div className="filtros">
          <div className="chips sem-margem">
            {(
              [
                ["todos", "Todas"],
                ["usuario", cap(v.persona.p)],
                ["verificador", cap(v.verificador.p)],
                ["admin", "Administración"],
              ] as [Filtro, string][]
            ).map(([id, t]) => (
              <button key={id} className={`chip ${filtro === id ? "activo" : ""}`} onClick={() => { setFiltro(id); setPagina(1); }}>
                {t} <em>{db.personas.filter((p) => id === "todos" || p.rol === id).length}</em>
              </button>
            ))}
          </div>
          <label className="input-icono">
            <Search size={15} />
            <input placeholder={`Buscar por nombre o ${v.centro.s}`} value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} aria-label="Buscar" />
          </label>
        </div>
        {cargando ? (
          <ListaSkel n={7} />
        ) : lista.length === 0 ? (
          <Vacio titulo="Nadie con ese filtro" texto="Prueba con otra búsqueda." />
        ) : (
          <>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Rol</th>
                    <th>{cap(v.centro.s)}</th>
                    <th className="der">{cap(v.marca.p)}</th>
                    <th className="der">Racha</th>
                    <th>Alta</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lista.slice((pagina - 1) * POR, pagina * POR).map((p) => {
                    const c = centros.get(p.centroId);
                    const antes = p.historial.length > 1 ? centros.get(p.historial[p.historial.length - 2].centroId) : undefined;
                    const r = p.rol === "usuario" ? racha(db, p.id).actual : 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="celda-persona">
                            <Avatar chave={p.avatar} nome={p.nombre} size={32} grupo={p.grupo} />
                            <b>{p.nombre}</b>
                          </span>
                        </td>
                        <td>
                          <select className="select select-mini" value={p.rol} disabled={!admin || p.id === sesion.id} title={admin ? undefined : soloAdmin} onChange={(e) => cambiarRol(p.id, e.target.value as Rol)} aria-label={`Rol de ${p.nombre}`}>
                            <option value="usuario">Usuario</option>
                            <option value="verificador">{cap(v.verificador.s)}</option>
                            <option value="admin">Administración</option>
                          </select>
                        </td>
                        <td>
                          {c ? (
                            <span className="celda-centro-txt">
                              <span>
                                <MapPin size={11} /> {c.nombre}
                              </span>
                              {antes && (
                                <small>
                                  <RotateCcw size={11} /> antes {antes.nombre}
                                </small>
                              )}
                            </span>
                          ) : (
                            <span className="muted">{rolTxt(p, v.verificador.s)}</span>
                          )}
                        </td>
                        <td className="der num">{cuenta.get(p.id) ?? 0}</td>
                        <td className="der">{p.rol === "usuario" ? <span className={`racha-mini ${r ? "on" : ""}`}><Flame size={12} /> {r}</span> : <span className="muted">-</span>}</td>
                        <td className="muted">{fechaCorta(p.alta)}</td>
                        <td className="der">
                          {p.rol !== "admin" && (
                            <button className="btn btn-claro btn-pequeno" onClick={() => setMover(p)} disabled={!admin} title={admin ? undefined : soloAdmin}>
                              <ArrowLeftRight size={14} /> Cambiar de {v.centro.s}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginacion pagina={pagina} total={lista.length} porPagina={POR} onPagina={setPagina} />
          </>
        )}
      </div>
      <Mover p={mover} onCerrar={() => setMover(null)} />
    </>
  );
}

function Mover({ p, onCerrar }: { p: Persona | null; onCerrar: () => void }) {
  const { db, v, mover } = useStore();
  const [destino, setDestino] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const actual = p ? db.centros.find((c) => c.id === p.centroId) : undefined;
  const opciones = db.centros.filter((c) => c.afiliado && c.id !== p?.centroId);
  const dest = destino || opciones[0]?.id || "";
  const enActual = p ? db.marcas.filter((m) => m.personaId === p.id && m.centroId === p.centroId).length : 0;
  const total = p ? db.marcas.filter((m) => m.personaId === p.id).length : 0;
  return (
    <Modal
      aberto={!!p}
      titulo={`${p?.nombre ?? ""} cambia de ${v.centro.s}`}
      onFechar={onCerrar}
      rodape={
        <>
          <button className="btn btn-claro" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            className="btn btn-primario"
            disabled={trabajando || !dest}
            onClick={async () => {
              if (!p) return;
              setTrabajando(true);
              await mover(p.id, dest);
              setTrabajando(false);
              setDestino("");
              onCerrar();
            }}
          >
            {trabajando ? <Spinner /> : <ArrowLeftRight size={16} />} Confirmar el cambio
          </button>
        </>
      }
    >
      <Campo rotulo={`${cap(v.centro.s)} nuevo`}>
        <select value={dest} onChange={(e) => setDestino(e.target.value)}>
          {opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}, {c.barrio}
            </option>
          ))}
        </select>
      </Campo>
      <div className="mover-explica">
        <div>
          <b>{enActual}</b>
          <span>
            {enActual === 1 ? v.marca.s : v.marca.p} en {actual?.nombre ?? "su centro"} se quedan allí y siguen sumando para ese {v.centro.s}, también en los meses todavía abiertos.
          </span>
        </div>
        <div>
          <b>{total}</b>
          <span>{v.marca.p} en total siguen en su historial y en sus récords personales. No se pierde nada.</span>
        </div>
      </div>
      <p className="aviso-linea">Desde la fecha del cambio, lo que suba cuenta para el {v.centro.s} nuevo.</p>
    </Modal>
  );
}
