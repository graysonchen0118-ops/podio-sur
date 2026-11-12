"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, ScrollText, Search, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cab, soloAdmin } from "./Shell";
import { Campo, Foto, ListaSkel, Modal, Paginacion, Spinner, Vacio, useCargando } from "../ui";
import type { Centro } from "@/lib/types";
import { HOY, fechaCorta, nombrePeriodo, periodoDe } from "@/lib/fecha";
import { afiliadoTxt, cap, nuevo, ranking } from "@/lib/calc";

const FOTOS_CENTRO = ["gym-1", "gym-3", "gym-6", "gym-9", "gym-11", "rec-8", "rec-9", "rec-10"];
type Filtro = "todos" | "si" | "no";

export default function Centros() {
  const { db, v, pts, sesion, desafiliar } = useStore();
  const cargando = useCargando(550);
  const admin = sesion.rol === "admin";
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [afiliar, setAfiliar] = useState<Centro | null>(null);
  const [quitar, setQuitar] = useState<Centro | null>(null);
  const [nuevoC, setNuevoC] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const mes = periodoDe(HOY);
  const filas = useMemo(() => new Map(ranking(db, mes, pts).map((f, i) => [f.centroId, { ...f, pos: i + 1 }])), [db, mes, pts]);
  const lista = db.centros
    .filter((c) => filtro === "todos" || (filtro === "si" ? c.afiliado : !c.afiliado))
    .filter((c) => !busca.trim() || `${c.nombre} ${c.barrio} ${c.ciudad}`.toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) => Number(b.afiliado) - Number(a.afiliado) || (filas.get(a.id)?.pos ?? 99) - (filas.get(b.id)?.pos ?? 99) || a.nombre.localeCompare(b.nombre));
  const POR = 12;
  const nPersonas = (id: string) => db.personas.filter((p) => p.centroId === id && p.rol === "usuario").length;
  const nMarcas = (id: string) => db.marcas.filter((m) => m.centroId === id).length;

  return (
    <>
      <Cab
        titulo={cap(v.centro.p)}
        sub={`${v.centro.g === "f" ? "Las" : "Los"} ${v.centro.p} ${v.centro.g === "f" ? "afiliadas" : "afiliados"} compiten en público. Los demás pueden aparecer como lugar de ${v.marca.g === "f" ? "una" : "un"} ${v.marca.s}: queda en el historial de la persona, no en el ranking.`}
        accion={
          <button className="btn btn-primario" onClick={() => setNuevoC(true)} disabled={!admin} title={admin ? undefined : soloAdmin}>
            <Plus size={17} /> {nuevo(v.centro)} {v.centro.s}
          </button>
        }
      />
      <div className="tabla-card entra d1">
        <div className="filtros">
          <div className="chips sem-margem">
            {(
              [
                ["todos", "Todos"],
                ["si", v.centro.g === "f" ? "Afiliadas" : "Afiliados"],
                ["no", v.centro.g === "f" ? "No afiliadas" : "No afiliados"],
              ] as [Filtro, string][]
            ).map(([id, t]) => (
              <button key={id} className={`chip ${filtro === id ? "activo" : ""}`} onClick={() => { setFiltro(id); setPagina(1); }}>
                {t} <em>{db.centros.filter((c) => id === "todos" || (id === "si" ? c.afiliado : !c.afiliado)).length}</em>
              </button>
            ))}
          </div>
          <label className="input-icono">
            <Search size={15} />
            <input placeholder="Buscar por nombre o barrio" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} aria-label="Buscar" />
          </label>
        </div>
        {cargando ? (
          <ListaSkel n={6} />
        ) : lista.length === 0 ? (
          <Vacio titulo={db.centros.length ? "Sin resultados" : `Todavía no hay ${v.centro.p}`} texto={db.centros.length ? "Prueba con otra búsqueda." : `Da de alta el primero con el botón de arriba.`} />
        ) : (
          <>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>{cap(v.centro.s)}</th>
                    <th>Compite</th>
                    <th className="der">{cap(v.persona.p)}</th>
                    <th className="der">{cap(v.marca.p)}</th>
                    <th className="der">{nombrePeriodo(mes).split(" ")[0]}</th>
                    <th>Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.slice((pagina - 1) * POR, pagina * POR).map((c) => {
                    const f = filas.get(c.id);
                    return (
                      <tr key={c.id}>
                        <td>
                          <span className="celda-centro">
                            <span className="celda-foto">
                              <Foto chave={c.foto} w={88} h={88} alt="" />
                            </span>
                            <span>
                              <b>{c.nombre}</b>
                              <small>
                                <MapPin size={11} /> {c.barrio}
                                {c.ciudad !== c.barrio ? `, ${c.ciudad}` : ""}
                              </small>
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="celda-toggle">
                            <button
                              className={`toggle ${c.afiliado ? "on" : ""}`}
                              disabled={!admin}
                              title={admin ? undefined : soloAdmin}
                              aria-label={c.afiliado ? `Quitar afiliación de ${c.nombre}` : `Afiliar ${c.nombre}`}
                              onClick={() => (c.afiliado ? setQuitar(c) : setAfiliar(c))}
                            >
                              <span />
                            </button>
                            <small>{afiliadoTxt(v.centro, c.afiliado)}</small>
                          </span>
                        </td>
                        <td className="der num">{nPersonas(c.id)}</td>
                        <td className="der num">{nMarcas(c.id)}</td>
                        <td className="der">{f ? <span className="pts-pos"><Trophy size={12} /> {f.pos}.º · {f.puntos} pts</span> : <span className="muted">no compite</span>}</td>
                        <td className="muted">{c.afiliadoDesde ? fechaCorta(c.afiliadoDesde) : "-"}</td>
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
      <Afiliar c={afiliar} onCerrar={() => setAfiliar(null)} />
      <Modal
        aberto={!!quitar}
        titulo={`Quitar la afiliación de ${quitar?.nombre ?? ""}`}
        onFechar={() => setQuitar(null)}
        rodape={
          <>
            <button className="btn btn-claro" onClick={() => setQuitar(null)}>
              Cancelar
            </button>
            <button
              className="btn btn-perigo"
              disabled={trabajando}
              onClick={async () => {
                if (!quitar) return;
                setTrabajando(true);
                await desafiliar(quitar.id);
                setTrabajando(false);
                setQuitar(null);
              }}
            >
              {trabajando ? <Spinner /> : null} Quitar afiliación
            </button>
          </>
        }
      >
        <p className="modal-txt">
          Deja de aparecer en el ranking del mes en curso. Sus {v.marca.p} siguen en el historial de cada persona y las actas ya firmadas no cambian.
        </p>
      </Modal>
      <NuevoCentro abierto={nuevoC} onCerrar={() => setNuevoC(false)} />
    </>
  );
}

function Afiliar({ c, onCerrar }: { c: Centro | null; onCerrar: () => void }) {
  const { db, v, afiliar } = useStore();
  const [politica, setPolitica] = useState<"records" | "periodo">("records");
  const [trabajando, setTrabajando] = useState(false);
  const mes = periodoDe(HOY);
  const previas = c ? db.marcas.filter((m) => m.centroId === c.id && m.estado === "verificada") : [];
  const esteMes = previas.filter((m) => periodoDe(m.fecha) === mes).length;
  return (
    <Modal
      aberto={!!c}
      titulo={`Afiliar ${c?.nombre ?? ""}`}
      onFechar={onCerrar}
      largura={600}
      rodape={
        <>
          <button className="btn btn-claro" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            className="btn btn-primario"
            disabled={trabajando}
            onClick={async () => {
              if (!c) return;
              setTrabajando(true);
              await afiliar(c.id, politica);
              setTrabajando(false);
              setPolitica("records");
              onCerrar();
            }}
          >
            {trabajando ? <Spinner /> : <Trophy size={16} />} Afiliar y competir desde hoy
          </button>
        </>
      }
    >
      <p className="modal-txt">
        Tiene {previas.length} {v.marca.p} {v.marca.g === "f" ? "verificadas" : "verificados"} de antes de afiliarse, {esteMes} de ellas en {nombrePeriodo(mes).toLowerCase()}. Hay que decidir dónde cuentan.
      </p>
      <div className="criterios">
        <label className={`radio-card ${politica === "records" ? "on" : ""}`}>
          <input type="radio" name="politica" checked={politica === "records"} onChange={() => setPolitica("records")} />
          <span>
            <b>Solo en los récords históricos</b>
            <small>Compite en el ranking con lo que haga desde hoy. Nadie pierde un puesto por {v.marca.p} que llegan de fuera a mitad de mes.</small>
          </span>
        </label>
        <label className={`radio-card ${politica === "periodo" ? "on" : ""}`}>
          <input type="radio" name="politica" checked={politica === "periodo"} onChange={() => setPolitica("periodo")} />
          <span>
            <b>También en el ranking de {nombrePeriodo(mes).split(" ")[0].toLowerCase()}</b>
            <small>Sus {esteMes} {v.marca.p} de este mes suman ya. Las de meses anteriores van solo a récords.</small>
          </span>
        </label>
      </div>
      <p className="aviso-linea">
        <ScrollText size={14} /> En ningún caso se tocan los meses con acta firmada: una vez firmada, esa tabla no se reescribe.
      </p>
    </Modal>
  );
}

function NuevoCentro({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { v, crearCentro } = useStore();
  const [nombre, setNombre] = useState("");
  const [barrio, setBarrio] = useState("");
  const [ciudad, setCiudad] = useState("Sevilla");
  const [afiliado, setAfiliado] = useState(true);
  const [foto, setFoto] = useState(FOTOS_CENTRO[0]);
  const [tocado, setTocado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const cerrar = () => {
    setNombre("");
    setBarrio("");
    setTocado(false);
    onCerrar();
  };
  return (
    <Modal
      aberto={abierto}
      titulo={`${nuevo(v.centro)} ${v.centro.s}`}
      onFechar={cerrar}
      largura={600}
      rodape={
        <>
          <button className="btn btn-claro" onClick={cerrar}>
            Cancelar
          </button>
          <button
            className="btn btn-primario"
            disabled={guardando}
            onClick={async () => {
              setTocado(true);
              if (nombre.trim().length < 3 || barrio.trim().length < 2) return;
              setGuardando(true);
              await crearCentro({ nombre: nombre.trim(), barrio: barrio.trim(), ciudad: ciudad.trim() || "Sevilla", afiliado, foto });
              setGuardando(false);
              cerrar();
            }}
          >
            {guardando ? <Spinner /> : <Plus size={16} />} Dar de alta
          </button>
        </>
      }
    >
      <div className="form-grade">
        <Campo rotulo="Nombre" error={tocado && nombre.trim().length < 3 ? "Al menos 3 letras" : undefined}>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Box Bellavista" />
        </Campo>
        <Campo rotulo="Barrio" error={tocado && barrio.trim().length < 2 ? "Falta el barrio" : undefined}>
          <input value={barrio} onChange={(e) => setBarrio(e.target.value)} placeholder="Bellavista" />
        </Campo>
        <Campo rotulo="Ciudad">
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </Campo>
      </div>
      <label className="check">
        <input type="checkbox" checked={afiliado} onChange={(e) => setAfiliado(e.target.checked)} /> Compite en el ranking desde hoy
      </label>
      <div className="campo">
        <span className="campo-rotulo">Foto</span>
        <div className="elige-fotos">
          {FOTOS_CENTRO.map((k) => (
            <button key={k} className={`elige-foto ${foto === k ? "on" : ""}`} onClick={() => setFoto(k)} aria-label="Elegir foto">
              <Foto chave={k} w={120} h={90} alt="" />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
