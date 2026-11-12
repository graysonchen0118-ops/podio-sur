"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, GitBranch, Lock, Pencil, Plus, Ruler, Sparkles, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cab, soloAdmin } from "./Shell";
import { Campo, Foto, Gaveta, ListaSkel, Modal, Spinner, Tilt, Vacio, useCargando } from "../ui";
import type { Prueba } from "@/lib/types";
import { fechaCorta } from "@/lib/fecha";
import { cap, nuevo, vigente } from "@/lib/calc";
import { METRICAS, UNIDADES, criterioCorto, criterioTexto, lecturaIngenua, unidadesDe, ver, type Criterio, type Metrica, type UnidadId } from "@/lib/unidades";

const FOTOS_ELEGIR = ["ev-remo-2", "ev-sentadilla-2", "ev-dominadas-2", "ev-carrera-2", "ev-salto-2", "gym-5", "rec-1", "rec-2", "rec-3"];

export default function Pruebas() {
  const { db, v, sesion, activarPrueba } = useStore();
  const cargando = useCargando(550);
  const [nueva, setNueva] = useState(false);
  const [editar, setEditar] = useState<string | null>(null);
  const admin = sesion.rol === "admin";
  const cuenta = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of db.marcas) m.set(x.pruebaId, (m.get(x.pruebaId) ?? 0) + 1);
    return m;
  }, [db.marcas]);
  const p = editar ? db.pruebas.find((x) => x.id === editar) : undefined;

  return (
    <>
      <Cab
        titulo={cap(v.prueba.p)}
        sub={`Se crean y se cambian desde aquí, sin tocar código. En cuanto ${v.prueba.g === "f" ? "una" : "un"} ${v.prueba.s} tiene ${v.marca.p}, su métrica, su unidad y su regla quedan bloqueadas: un cambio crea una versión nueva y cada ${v.marca.s} recuerda la suya.`}
        accion={
          <button className="btn btn-primario" onClick={() => setNueva(true)} disabled={!admin} title={admin ? undefined : soloAdmin}>
            <Plus size={17} /> {nuevo(v.prueba)} {v.prueba.s}
          </button>
        }
      />
      {!admin && <p className="aviso-linea">{soloAdmin}</p>}
      {cargando ? (
        <ListaSkel n={4} h={120} />
      ) : db.pruebas.length === 0 ? (
        <div className="tabla-card">
          <Vacio
            titulo={`Todavía no hay ${v.prueba.p}`}
            texto={`Crea la primera: nombre, qué se mide, en qué unidad y si gana el valor más alto o el más bajo.`}
            accion={
              <button className="btn btn-primario btn-pequeno" onClick={() => setNueva(true)} disabled={!admin}>
                <Plus size={15} /> Crear {v.prueba.s}
              </button>
            }
          />
        </div>
      ) : (
        <div className="pruebas-grid">
          {db.pruebas.map((x, i) => {
            const u = vigente(x);
            const n = cuenta.get(x.id) ?? 0;
            return (
              <Tilt key={x.id} className={`prueba-card entra ${x.activa ? "" : "inactiva"}`} max={4}>
                <div className="prueba-foto" style={{ animationDelay: `${i * 0.04}s` }}>
                  <Foto chave={x.foto} w={480} h={240} alt={x.nombre} />
                  <span className="prueba-v">
                    <GitBranch size={12} /> v{u.v}
                  </span>
                </div>
                <div className="prueba-cuerpo">
                  <h3>{x.nombre}</h3>
                  <p>{x.descripcion}</p>
                  <div className="prueba-chips">
                    <span className="tag tag-neutro">{METRICAS.find((m) => m.id === u.metrica)?.nombre}</span>
                    {UNIDADES[u.unidad].nombre.toLowerCase() !== (METRICAS.find((m) => m.id === u.metrica)?.nombre ?? "").toLowerCase() && <span className="tag tag-neutro">en {UNIDADES[u.unidad].nombre}</span>}
                    <span className="tag tag-laranja">{criterioCorto(u.criterio)}</span>
                  </div>
                  <div className="prueba-pie">
                    <span>
                      <span>
                        <b>{n}</b> {n === 1 ? v.marca.s : v.marca.p}
                      </span>
                      {n > 0 && (
                        <em>
                          <Lock size={11} /> definición bloqueada
                        </em>
                      )}
                    </span>
                    <button className={`toggle ${x.activa ? "on" : ""}`} onClick={() => admin && activarPrueba(x.id, !x.activa)} aria-label={x.activa ? "Ocultar en la app" : "Mostrar en la app"} disabled={!admin}>
                      <span />
                    </button>
                  </div>
                  <button className="btn btn-claro btn-pequeno btn-bloco" onClick={() => setEditar(x.id)}>
                    <Pencil size={14} /> Abrir {v.prueba.s}
                  </button>
                </div>
              </Tilt>
            );
          })}
        </div>
      )}
      <NuevaPrueba abierto={nueva} onCerrar={() => setNueva(false)} />
      <EditarPrueba p={p} n={p ? cuenta.get(p.id) ?? 0 : 0} onCerrar={() => setEditar(null)} />
    </>
  );
}

function NuevaPrueba({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { v, crearPrueba } = useStore();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [metrica, setMetrica] = useState<Metrica>("tiempo");
  const [unidad, setUnidad] = useState<UnidadId>("mmss");
  const [criterio, setCriterio] = useState<Criterio>("menor");
  const [definicion, setDefinicion] = useState("");
  const [foto, setFoto] = useState(FOTOS_ELEGIR[0]);
  const [tocado, setTocado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const u = UNIDADES[unidad];
  const errNombre = tocado && nombre.trim().length < 3 ? "Ponle un nombre de al menos 3 letras" : undefined;
  const errDef = tocado && definicion.trim().length < 3 ? "Qué se mide exactamente, para que nadie lo interprete distinto" : undefined;
  const ejemplo = u.leer(u.ejemplo) ?? 0;
  const cerrar = () => {
    setNombre("");
    setDescripcion("");
    setDefinicion("");
    setTocado(false);
    onCerrar();
  };
  const guardar = async () => {
    setTocado(true);
    if (nombre.trim().length < 3 || definicion.trim().length < 3) return;
    setGuardando(true);
    await crearPrueba({ nombre: nombre.trim(), descripcion: descripcion.trim() || definicion.trim(), metrica, unidad, criterio, definicion: definicion.trim(), foto });
    setGuardando(false);
    cerrar();
  };
  return (
    <Modal
      aberto={abierto}
      titulo={`${nuevo(v.prueba)} ${v.prueba.s}`}
      onFechar={cerrar}
      largura={680}
      rodape={
        <>
          <button className="btn btn-claro" onClick={cerrar}>
            Cancelar
          </button>
          <button className="btn btn-primario" onClick={guardar} disabled={guardando}>
            {guardando ? <Spinner /> : <Plus size={16} />} Crear {v.prueba.s}
          </button>
        </>
      }
    >
      <div className="form-grade">
        <Campo rotulo="Nombre" error={errNombre}>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Remo 2.000 m" />
        </Campo>
        <Campo rotulo="Qué se mide exactamente" error={errDef}>
          <input value={definicion} onChange={(e) => setDefinicion(e.target.value)} placeholder="2.000 m en remoergómetro" />
        </Campo>
      </div>
      <Campo rotulo="Descripción para la app" ayuda="La lee quien sube el resultado. Opcional.">
        <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Foto del monitor nada más terminar" />
      </Campo>
      <div className="form-grade">
        <Campo rotulo="Métrica">
          <select
            value={metrica}
            onChange={(e) => {
              const m = e.target.value as Metrica;
              setMetrica(m);
              setUnidad(unidadesDe(m)[0].id);
            }}
          >
            {METRICAS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Unidad en pantalla">
          <select value={unidad} onChange={(e) => setUnidad(e.target.value as UnidadId)}>
            {unidadesDe(metrica).map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre} ({x.corto})
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <div className="criterios" role="radiogroup" aria-label="Criterio de clasificación">
        {(["menor", "mayor"] as Criterio[]).map((c) => (
          <label key={c} className={`radio-card ${criterio === c ? "on" : ""}`}>
            <input type="radio" name="criterio" checked={criterio === c} onChange={() => setCriterio(c)} />
            <span>
              <b>{criterioTexto(c)}</b>
              <small>{c === "menor" ? "Tiempos de carrera, remo, natación" : "Peso, repeticiones, distancia, kilos reciclados"}</small>
            </span>
          </label>
        ))}
      </div>
      <div className="campo">
        <span className="campo-rotulo">Foto de la tarjeta</span>
        <div className="elige-fotos">
          {FOTOS_ELEGIR.map((k) => (
            <button key={k} className={`elige-foto ${foto === k ? "on" : ""}`} onClick={() => setFoto(k)} aria-label="Elegir foto">
              <Foto chave={k} w={120} h={90} alt="" />
            </button>
          ))}
        </div>
      </div>
      <div className="vista-previa">
        <Sparkles size={16} />
        <div>
          <b>
            Así se verá: {u.ver(ejemplo)}, {criterioTexto(criterio).toLowerCase()}.
          </b>
          <small>
            Se guarda en {METRICAS.find((m) => m.id === metrica)?.base} ({ejemplo}), así esta {v.prueba.s} se ordena con la misma consulta que todas las demás.
          </small>
        </div>
      </div>
    </Modal>
  );
}

function EditarPrueba({ p, n, onCerrar }: { p?: Prueba; n: number; onCerrar: () => void }) {
  const { db, v, sesion, editarPrueba } = useStore();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [version, setVersion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  if (p && p.id !== id) {
    setId(p.id);
    setNombre(p.nombre);
    setDescripcion(p.descripcion);
  }
  if (!p) return <Gaveta aberto={false} titulo="" onFechar={onCerrar}>{null}</Gaveta>;
  const admin = sesion.rol === "admin";
  const u = vigente(p);
  const porVersion = (vn: number) => db.marcas.filter((m) => m.pruebaId === p.id && m.version === vn).length;
  const bloqueada = n > 0;
  const cambiado = nombre !== p.nombre || descripcion !== p.descripcion;
  return (
    <Gaveta
      aberto={!!p}
      largo
      titulo={p.nombre}
      sub={
        <>
          <GitBranch size={13} /> versión {u.v} · {n} {n === 1 ? v.marca.s : v.marca.p}
        </>
      }
      onFechar={onCerrar}
      rodape={
        <>
          <button
            className="btn btn-primario"
            disabled={!admin || !cambiado || guardando || nombre.trim().length < 3}
            onClick={async () => {
              setGuardando(true);
              await editarPrueba(p.id, { nombre: nombre.trim(), descripcion: descripcion.trim() });
              setGuardando(false);
            }}
          >
            {guardando ? <Spinner /> : null} Guardar nombre y descripción
          </button>
          <button className="btn btn-claro" onClick={onCerrar}>
            Cerrar
          </button>
        </>
      }
    >
      <div className="form-grade">
        <Campo rotulo="Nombre" ayuda="Se puede cambiar siempre: no cambia lo que se mide.">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={!admin} />
        </Campo>
      </div>
      <Campo rotulo="Descripción">
        <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} disabled={!admin} />
      </Campo>

      <div className={`definicion ${bloqueada ? "bloqueada" : ""}`}>
        <div className="definicion-cab">
          <span>
            <Ruler size={16} /> Definición de la versión {u.v}
          </span>
          {bloqueada && (
            <span className="tag tag-neutro">
              <Lock size={12} /> bloqueada
            </span>
          )}
        </div>
        <div className="definicion-grid">
          <div>
            <small>Qué se mide</small>
            <b>{u.definicion}</b>
          </div>
          <div>
            <small>Métrica</small>
            <b>{METRICAS.find((m) => m.id === u.metrica)?.nombre}</b>
          </div>
          <div>
            <small>Unidad</small>
            <b>{UNIDADES[u.unidad].nombre}</b>
          </div>
          <div>
            <small>Criterio</small>
            <b>{criterioTexto(u.criterio)}</b>
          </div>
        </div>
        {bloqueada ? (
          <p>
            {n} {v.marca.p} dependen de esta definición. Editarla encima cambiaría lo que significan; por eso un cambio crea la versión {u.v + 1} y cada {v.marca.s} sigue leyéndose con la suya.
          </p>
        ) : (
          <p>Todavía no tiene {v.marca.p}: el primer cambio de definición también crea versión, para que quede constancia.</p>
        )}
        <button className="btn btn-claro btn-pequeno" onClick={() => setVersion(true)} disabled={!admin} title={admin ? undefined : soloAdmin}>
          <GitBranch size={14} /> Crear versión {u.v + 1}
        </button>
      </div>

      <div className="versiones">
        <span className="mini-rot">Versiones</span>
        <ol>
          {[...p.versiones].reverse().map((x) => (
            <li key={x.v} className={x.v === u.v ? "actual" : ""}>
              <span className="versiones-n">v{x.v}</span>
              <div>
                <b>
                  {UNIDADES[x.unidad].nombre}, {criterioCorto(x.criterio)}
                </b>
                <small>
                  desde el {fechaCorta(x.desde)} · {porVersion(x.v)} {v.marca.p}
                  {x.v > 1 && (p.versiones.find((y) => y.v === x.v - 1)?.escala === x.escala ? " · récords continúan" : " · tabla de récords propia")}
                </small>
                {x.motivo && <em>{x.motivo}</em>}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <NuevaVersion p={p} abierto={version} onCerrar={() => setVersion(false)} />
    </Gaveta>
  );
}

function NuevaVersion({ p, abierto, onCerrar }: { p: Prueba; abierto: boolean; onCerrar: () => void }) {
  const { db, v, versionar } = useStore();
  const u = vigente(p);
  const [metrica, setMetrica] = useState<Metrica>(u.metrica);
  const [unidad, setUnidad] = useState<UnidadId>(u.unidad === "s" ? "min" : u.unidad);
  const [criterio, setCriterio] = useState<Criterio>(u.criterio);
  const [definicion, setDefinicion] = useState(u.definicion);
  const [motivo, setMotivo] = useState("");
  const [tocado, setTocado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    if (!abierto) return;
    setMetrica(u.metrica);
    setUnidad(u.unidad === "s" ? "min" : u.unidad);
    setCriterio(u.criterio);
    setDefinicion(u.definicion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, u.v]);
  const muestras = useMemo(() => db.marcas.filter((m) => m.pruebaId === p.id && m.version === u.v && m.estado === "verificada").slice(0, 3), [db.marcas, p.id, u.v]);
  const mismaEscala = metrica === u.metrica && criterio === u.criterio && definicion.trim() === u.definicion.trim();
  const sinCambios = mismaEscala && unidad === u.unidad;
  const personas = new Map(db.personas.map((x) => [x.id, x]));
  const guardar = async () => {
    setTocado(true);
    if (sinCambios || motivo.trim().length < 5) return;
    setGuardando(true);
    await versionar(p.id, { metrica, unidad, criterio, definicion: definicion.trim(), motivo: motivo.trim() });
    setGuardando(false);
    setMotivo("");
    setTocado(false);
    onCerrar();
  };
  return (
    <Modal
      aberto={abierto}
      titulo={`Versión ${u.v + 1} de ${p.nombre}`}
      onFechar={onCerrar}
      largura={720}
      rodape={
        <>
          <button className="btn btn-claro" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="btn btn-primario" onClick={guardar} disabled={guardando || sinCambios}>
            {guardando ? <Spinner /> : <GitBranch size={16} />} Crear versión {u.v + 1}
          </button>
        </>
      }
    >
      <div className="form-grade">
        <Campo rotulo="Métrica">
          <select
            value={metrica}
            onChange={(e) => {
              const m = e.target.value as Metrica;
              setMetrica(m);
              setUnidad(unidadesDe(m)[0].id);
            }}
          >
            {METRICAS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Unidad en pantalla">
          <select value={unidad} onChange={(e) => setUnidad(e.target.value as UnidadId)} aria-label="Unidad nueva">
            {unidadesDe(metrica).map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre} ({x.corto})
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Criterio">
          <select value={criterio} onChange={(e) => setCriterio(e.target.value as Criterio)}>
            <option value="menor">Gana el valor más bajo</option>
            <option value="mayor">Gana el valor más alto</option>
          </select>
        </Campo>
      </div>
      <Campo rotulo="Qué se mide exactamente">
        <input value={definicion} onChange={(e) => setDefinicion(e.target.value)} />
      </Campo>

      {muestras.length > 0 && metrica === u.metrica && (
        <div className="compara">
          <div className="compara-col mal">
            <span className="compara-tit">
              <TriangleAlert size={15} /> Editando la {v.prueba.s} encima
            </span>
            <small>Lo habitual: el número tecleado se queda y la unidad cambia debajo.</small>
            <ul>
              {muestras.map((m) => (
                <li key={m.id}>
                  <em>{personas.get(m.personaId)?.nombre.split(" ")[0]}</em>
                  <span>{ver(m.valor, u.unidad)}</span>
                  <ArrowRight size={13} />
                  <b>{unidad === u.unidad ? ver(m.valor, unidad) : lecturaIngenua(m.valor, u.unidad, unidad)}</b>
                </li>
              ))}
            </ul>
          </div>
          <div className="compara-col bien">
            <span className="compara-tit">
              <GitBranch size={15} /> Con la versión {u.v + 1}
            </span>
            <small>Cada {v.marca.s} guarda su valor base y la versión con la que se hizo.</small>
            <ul>
              {muestras.map((m) => (
                <li key={m.id}>
                  <em>{personas.get(m.personaId)?.nombre.split(" ")[0]}</em>
                  <span>{ver(m.valor, u.unidad)}</span>
                  <ArrowRight size={13} />
                  <b>{ver(m.valor, unidad)}</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <p className={`aviso-linea ${mismaEscala ? "" : "fuerte"}`}>
        {sinCambios
          ? "Cambia la unidad, el criterio o lo que se mide para crear una versión."
          : mismaEscala
            ? `Solo cambia la forma de escribirla: misma medida, así que los récords y rankings continúan. Las ${v.marca.p} anteriores siguen en la versión ${u.v}.`
            : `Cambia lo que se mide o cómo se gana: la versión ${u.v + 1} abre su propia tabla de récords. Las ${v.marca.p} anteriores y las actas firmadas no se tocan.`}
      </p>
      <Campo rotulo="Motivo del cambio" error={tocado && motivo.trim().length < 5 ? "Una frase, queda en el historial de la prueba" : undefined}>
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Los centros prefieren ver minutos y segundos" />
      </Campo>
    </Modal>
  );
}
