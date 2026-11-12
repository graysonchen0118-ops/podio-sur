"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Camera, CheckCircle2, Clock, ExternalLink, Link2, MapPin, ScrollText, Search, ShieldAlert, TrendingUp, Video, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cab } from "./Shell";
import { Avatar, EstadoTag, Foto, Gaveta, ListaSkel, Numero, Paginacion, Spinner, Vacio, useCargando } from "../ui";
import { RankingVivo } from "../three";
import type { Marca } from "@/lib/types";
import { HOY, fechaCorta, fechaHora, haceTexto, nombrePeriodo, periodoDe } from "@/lib/fecha";
import { cap, estadoPeriodo, fechaFirma, mejorPersonal, ranking, versionDe } from "@/lib/calc";
import { ver } from "@/lib/unidades";

type Filtro = "provisional" | "conservada" | "verificada" | "rechazada";
const POR = 10;

export default function Verificacion() {
  const { db, v, pts, sesion, pulso } = useStore();
  const cargando = useCargando(600);
  const [filtro, setFiltro] = useState<Filtro>("provisional");
  const [busca, setBusca] = useState("");
  const [prueba, setPrueba] = useState("");
  const [orden, setOrden] = useState<"reciente" | "antigua">("antigua");
  const [pagina, setPagina] = useState(1);
  const [abierta, setAbierta] = useState<string | null>(null);
  const personas = useMemo(() => new Map(db.personas.map((p) => [p.id, p])), [db.personas]);
  const centros = useMemo(() => new Map(db.centros.map((c) => [c.id, c])), [db.centros]);
  const pruebas = useMemo(() => new Map(db.pruebas.map((p) => [p.id, p])), [db.pruebas]);

  const firmados = useMemo(() => new Set(db.actas.map((a) => a.periodo)), [db.actas]);
  const enFiltro = useCallback(
    (m: Marca, f: Filtro) => (f === "provisional" ? m.estado === "provisional" && !firmados.has(periodoDe(m.fecha)) : f === "conservada" ? m.estado === "provisional" && firmados.has(periodoDe(m.fecha)) : m.estado === f),
    [firmados],
  );
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return db.marcas
      .filter((m) => enFiltro(m, filtro))
      .filter((m) => !prueba || m.pruebaId === prueba)
      .filter((m) => !q || personas.get(m.personaId)?.nombre.toLowerCase().includes(q) || centros.get(m.centroId)?.nombre.toLowerCase().includes(q))
      .sort((a, b) => (orden === "reciente" ? b.fecha - a.fecha : a.fecha - b.fecha));
  }, [db.marcas, filtro, prueba, busca, orden, personas, centros, enFiltro]);
  useEffect(() => setPagina(1), [filtro, prueba, busca, orden]);

  const pend = db.marcas.filter((m) => enFiltro(m, "provisional")).length;
  const propias = db.marcas.filter((m) => enFiltro(m, "provisional") && sesion.centroId && m.centroId === sesion.centroId).length;
  const rech = db.marcas.filter((m) => m.estado === "rechazada" && periodoDe(m.fecha) === periodoDe(HOY)).length;
  const verMes = db.marcas.filter((m) => m.estado === "verificada" && periodoDe(m.fecha) === periodoDe(HOY)).length;
  const filas = ranking(db, periodoDe(HOY), pts).slice(0, 6);
  const marca = abierta ? db.marcas.find((m) => m.id === abierta) : undefined;

  return (
    <>
      <Cab
        titulo="Verificación"
        sub={
          <>
            {cap(v.marca.p)} provisionales esperando revisión. Nadie valida {v.marca.p} de su propio {v.centro.s}
            {sesion.centroId ? `: con esta sesión, las de ${centros.get(sesion.centroId)?.nombre} quedan para otra persona.` : "."}
          </>
        }
      />
      <div className="verif-top">
        <div className="kpis">
          <div className="kpi entra d1">
            <span className="kpi-icono alerta">
              <Clock size={18} />
            </span>
            <b>
              <Numero valor={pend} />
            </b>
            <small>pendientes</small>
          </div>
          <div className="kpi entra d2">
            <span className="kpi-icono ok">
              <BadgeCheck size={18} />
            </span>
            <b>
              <Numero valor={verMes} />
            </b>
            <small>{v.marca.g === "f" ? "verificadas" : "verificados"} en {nombrePeriodo(periodoDe(HOY)).split(" ")[0].toLowerCase()}</small>
          </div>
          <div className="kpi entra d3">
            <span className="kpi-icono erro">
              <XCircle size={18} />
            </span>
            <b>
              <Numero valor={rech} />
            </b>
            <small>{v.marca.g === "f" ? "rechazadas" : "rechazados"} este mes</small>
          </div>
          {sesion.centroId && (
            <div className="kpi entra d4">
              <span className="kpi-icono info">
                <ShieldAlert size={18} />
              </span>
              <b>{propias}</b>
              <small>de tu {v.centro.s}, no te tocan</small>
            </div>
          )}
        </div>
        <div className="verif-vivo entra d2">
          <div className="verif-vivo-cab">
            <span className="mini-rot">{nombrePeriodo(periodoDe(HOY))}, en vivo</span>
            <small>Cada verificación sube la columna de su {v.centro.s}</small>
          </div>
          <div className="verif-vivo-cena">
            <RankingVivo key={db.config.id} filas={filas.map((f) => ({ id: f.centroId, nombre: centros.get(f.centroId)?.nombre ?? "", puntos: f.puntos }))} pulso={pulso} />
          </div>
        </div>
      </div>

      <div className="tabla-card entra d3">
        <div className="filtros">
          <div className="chips sem-margem">
            {(
              [
                ["provisional", "Pendientes"],
                ["verificada", v.marca.g === "f" ? "Verificadas" : "Verificados"],
                ["rechazada", v.marca.g === "f" ? "Rechazadas" : "Rechazados"],
                ["conservada", "Provisionales con acta firmada"],
              ] as [Filtro, string][]
            ).map(([id, t]) => (
              <button key={id} className={`chip ${filtro === id ? "activo" : ""}`} onClick={() => setFiltro(id)}>
                {t} <em>{db.marcas.filter((m) => enFiltro(m, id)).length}</em>
              </button>
            ))}
          </div>
          <div className="filtros-der">
            <label className="input-icono">
              <Search size={15} />
              <input placeholder={`Buscar ${v.persona.s} o ${v.centro.s}`} value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
            </label>
            <select value={prueba} onChange={(e) => setPrueba(e.target.value)} aria-label={cap(v.prueba.s)} className="select">
              <option value="">Todas las {v.prueba.p}</option>
              {db.pruebas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <select value={orden} onChange={(e) => setOrden(e.target.value as "reciente" | "antigua")} aria-label="Orden" className="select">
              <option value="antigua">Más antiguas primero</option>
              <option value="reciente">Más recientes primero</option>
            </select>
          </div>
        </div>
        {cargando ? (
          <ListaSkel n={6} />
        ) : (
          <>
            {filtro === "conservada" && (
              <p className="aviso-linea">
                Nadie las verificó antes de firmar el acta de su mes. Se conservan como provisionales en el historial de cada {v.persona.s}; si se verifican ahora, cuentan en los récords y el acta no cambia.
              </p>
            )}
          </>
        )}
        {cargando ? null : lista.length === 0 ? (
          <Vacio titulo={filtro === "provisional" ? "Cola vacía" : "Nada con ese filtro"} texto={filtro === "provisional" ? `No queda ningún${v.marca.g === "f" ? "a" : ""} ${v.marca.s} por revisar.` : "Prueba con otra búsqueda."} />
        ) : (
          <>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>{cap(v.persona.s)}</th>
                    <th>{cap(v.prueba.s)}</th>
                    <th className="der">Resultado</th>
                    <th>{cap(v.centro.s)}</th>
                    <th>Hecha</th>
                    <th>Evidencia</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lista.slice((pagina - 1) * POR, pagina * POR).map((m) => {
                    const p = personas.get(m.personaId);
                    const pr = pruebas.get(m.pruebaId);
                    const c = centros.get(m.centroId);
                    if (!p || !pr) return null;
                    const vv = versionDe(pr, m.version);
                    const per = periodoDe(m.fecha);
                    const est = estadoPeriodo(db, per);
                    const propia = !!sesion.centroId && sesion.centroId === m.centroId;
                    return (
                      <tr key={m.id} className={`fila-click ${propia ? "fila-propia" : ""}`} onClick={() => setAbierta(m.id)}>
                        <td>
                          <span className="celda-persona">
                            <Avatar chave={p.avatar} nome={p.nombre} size={30} grupo={p.grupo} />
                            <b>{p.nombre}</b>
                          </span>
                        </td>
                        <td>{pr.nombre}</td>
                        <td className="der num">{ver(m.valor, vv.unidad)}</td>
                        <td>
                          <span className={c?.afiliado ? "" : "muted"}>{c?.nombre}</span>
                          {propia && <span className="tag tag-info mini">tu {v.centro.s}</span>}
                          {!c?.afiliado && <span className="tag tag-neutro mini">no compite</span>}
                        </td>
                        <td>
                          <span className="celda-fecha">
                            {fechaHora(m.fecha)}
                            {per !== periodoDe(HOY) && (filtro === "provisional" || filtro === "conservada") && (
                              <span className={`tag mini ${est === "firmado" ? "tag-neutro" : "tag-alerta"}`}>{est === "firmado" ? "acta firmada" : `${nombrePeriodo(per).split(" ")[0].toLowerCase()}, en plazo`}</span>
                            )}
                          </span>
                        </td>
                        <td>
                          <span className="celda-ev">
                            {m.evidencia.tipo === "foto" ? <Camera size={15} /> : <Video size={15} />}
                            {!m.evidencia.codigoVisible && (
                              <span className="tag tag-erro mini" title="Quien la subió no marcó que el código se vea">
                                sin código
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="der">
                          <button className="btn btn-claro btn-pequeno" onClick={(e) => { e.stopPropagation(); setAbierta(m.id); }}>
                            Revisar
                          </button>
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
      <Revision m={marca} onCerrar={() => setAbierta(null)} />
    </>
  );
}

function Revision({ m, onCerrar }: { m?: Marca; onCerrar: () => void }) {
  const { db, v, sesion, verificar, rechazar } = useStore();
  const [modo, setModo] = useState<"ver" | "rechazar">("ver");
  const [motivo, setMotivo] = useState("");
  const [trabajando, setTrabajando] = useState<"" | "verificar" | "rechazar">("");
  const [sello, setSello] = useState(false);
  useEffect(() => {
    setModo("ver");
    setMotivo("");
    setSello(false);
  }, [m?.id]);
  if (!m) return <Gaveta aberto={false} titulo="" onFechar={onCerrar}>{null}</Gaveta>;
  const p = db.personas.find((x) => x.id === m.personaId)!;
  const pr = db.pruebas.find((x) => x.id === m.pruebaId)!;
  const vv = versionDe(pr, m.version);
  const c = db.centros.find((x) => x.id === m.centroId);
  const per = periodoDe(m.fecha);
  const est = estadoPeriodo(db, per);
  const propia = !!sesion.centroId && sesion.centroId === m.centroId;
  const antes = mejorPersonal(db, p.id, pr.id, true, m.id);
  const mejora = antes ? ((vv.criterio === "menor" ? antes.valor - m.valor : m.valor - antes.valor) / antes.valor) * 100 : null;
  const motivos = ["El código del día no aparece", "La evidencia no deja ver el resultado", `Subida en otra ${v.prueba.s}`, "El resultado no coincide con la evidencia"];
  const quien = m.verificadaPor ? db.personas.find((x) => x.id === m.verificadaPor) : undefined;

  const ok = async () => {
    setTrabajando("verificar");
    try {
      await verificar(m.id);
      setSello(true);
      setTimeout(onCerrar, 1400);
    } finally {
      setTrabajando("");
    }
  };
  const no = async () => {
    if (!motivo) return;
    setTrabajando("rechazar");
    try {
      await rechazar(m.id, motivo);
      setTimeout(onCerrar, 500);
    } finally {
      setTrabajando("");
    }
  };

  return (
    <Gaveta
      aberto={!!m}
      largo
      titulo={`${pr.nombre}: ${ver(m.valor, vv.unidad)}`}
      sub={
        <>
          <Avatar chave={p.avatar} nome={p.nombre} size={22} grupo={p.grupo} /> {p.nombre} · {fechaHora(m.fecha)} · <EstadoTag e={m.estado} g={v.marca.g} />
        </>
      }
      onFechar={onCerrar}
      rodape={
        m.estado === "provisional" ? (
          modo === "ver" ? (
            <>
              <button className="btn btn-primario" disabled={propia || !!trabajando} onClick={ok}>
                {trabajando === "verificar" ? <Spinner /> : <CheckCircle2 size={17} />} Verificar
              </button>
              <button className="btn btn-claro btn-perigo-txt" disabled={propia || !!trabajando} onClick={() => setModo("rechazar")}>
                <XCircle size={17} /> Rechazar
              </button>
              <button className="btn btn-claro" onClick={onCerrar}>
                Dejar provisional
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-perigo" disabled={!motivo || !!trabajando} onClick={no}>
                {trabajando === "rechazar" ? <Spinner /> : <XCircle size={17} />} Rechazar con este motivo
              </button>
              <button className="btn btn-claro" onClick={() => setModo("ver")}>
                Volver
              </button>
            </>
          )
        ) : (
          <button className="btn btn-claro" onClick={onCerrar}>
            Cerrar
          </button>
        )
      }
    >
      {propia && m.estado === "provisional" && (
        <div className="aviso aviso-info">
          <ShieldAlert size={18} />
          <div>
            <b>
              Es {v.marca.g === "f" ? "una" : "un"} {v.marca.s} de tu propio {v.centro.s}, {c?.nombre}.
            </b>
            <p>La verifica alguien de otro {v.centro.s}. Así ningún {v.centro.s} arbitra su propio ranking. Puedes cambiar de sesión arriba para probarlo.</p>
          </div>
        </div>
      )}
      <div className={`rev-evidencia ${sello ? "sellada" : ""}`}>
        {m.evidencia.tipo === "foto" ? (
          <div className="rev-foto">
            {m.evidencia.archivo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.evidencia.archivo} alt="Evidencia subida" className="foto foto-ok" />
            ) : (
              <Foto chave={m.evidencia.foto!} w={900} h={600} alt={`Evidencia de ${pr.nombre}`} eager />
            )}
          </div>
        ) : (
          <div className="rev-video">
            <Video size={28} />
            <div>
              <b>Enlace de vídeo</b>
              <span>{m.evidencia.url?.replace(/^https?:\/\/(www\.)?/, "")}</span>
              <small>Se abre en su plataforma. El vídeo no se aloja aquí.</small>
            </div>
            <span className="rev-video-btn" aria-hidden="true">
              <ExternalLink size={15} /> Abrir
            </span>
          </div>
        )}
        {sello && (
          <div className="rev-sello" aria-live="polite">
            <BadgeCheck size={34} />
            <span>{v.marca.g === "f" ? "Verificada" : "Verificado"}</span>
          </div>
        )}
      </div>

      <div className={`rev-codigo ${m.evidencia.codigoVisible ? "" : "falta"}`}>
        <div>
          <small>Código del {fechaCorta(m.fecha)}</small>
          <b>{m.evidencia.codigo}</b>
        </div>
        <p>
          {m.evidencia.codigoVisible
            ? `Búscalo en la ${m.evidencia.tipo === "foto" ? "foto" : "grabación"}: escrito junto al resultado o dicho en voz alta. Una foto antigua, de otro sitio o sacada de internet no puede tenerlo.`
            : "Quien la subió no marcó que el código se vea. Sin código, la evidencia demuestra una imagen, no este resultado."}
        </p>
      </div>

      <dl className="rev-datos">
        <div>
          <dt>{cap(v.prueba.s)}</dt>
          <dd>
            {pr.nombre}
            {pr.versiones.length > 1 && <span className="tag tag-neutro mini">v{vv.v}</span>}
            <small>{vv.definicion}</small>
          </dd>
        </div>
        <div>
          <dt>Resultado</dt>
          <dd>
            <b>{ver(m.valor, vv.unidad)}</b>
            {mejora !== null && antes && (
              <small className={mejora > 8 ? "txt-alerta" : ""}>
                <TrendingUp size={12} /> {mejora >= 0 ? `Mejora su mejor ${v.marca.s} (${ver(antes.valor, vv.unidad)}) un ${mejora.toFixed(1).replace(".", ",")} %` : `Por debajo de su mejor ${v.marca.s} (${ver(antes.valor, vv.unidad)})`}
                {mejora > 8 ? ". Salto grande: revísala con calma." : ""}
              </small>
            )}
            {!antes && <small>Primera {v.marca.s} verificable en esta {v.prueba.s}.</small>}
          </dd>
        </div>
        <div>
          <dt>{cap(v.centro.s)}</dt>
          <dd>
            <MapPin size={13} /> {c?.nombre}, {c?.barrio}
            <small>{c?.afiliado ? "Compite en el ranking." : `No ${v.centro.g === "f" ? "afiliada" : "afiliado"}: queda en el historial, sin puntos de ranking.`}</small>
          </dd>
        </div>
        <div>
          <dt>Cuenta en</dt>
          <dd>
            <ScrollText size={13} /> {nombrePeriodo(per)}
            <small>
              {est === "firmado"
                ? "El acta de ese mes ya está firmada: si la verificas, cuenta en el historial y en los récords, la tabla del mes no cambia."
                : est === "abierto"
                  ? "El mes en que se hizo, aunque se verifique más tarde."
                  : `El mes en que se hizo. Está en plazo: si se verifica antes del ${fechaCorta(fechaFirma(db, per))}, entra en el acta.`}
            </small>
          </dd>
        </div>
        <div>
          <dt>Subida</dt>
          <dd>
            {fechaHora(m.subida)}
            <small>{haceTexto(m.subida)}</small>
          </dd>
        </div>
        {quien && (
          <div>
            <dt>{m.estado === "rechazada" ? "Rechazada por" : "Verificada por"}</dt>
            <dd>
              {quien.nombre}
              <small>
                {db.centros.find((x) => x.id === quien.centroId)?.nombre ?? "Administración"}
                {m.verificadaEl ? ` · ${fechaHora(m.verificadaEl)}` : ""}
              </small>
            </dd>
          </div>
        )}
        {m.motivo && (
          <div>
            <dt>Motivo</dt>
            <dd>
              <AlertTriangle size={13} /> {m.motivo}
            </dd>
          </div>
        )}
      </dl>

      {modo === "rechazar" && (
        <div className="rev-motivos">
          <span className="campo-rotulo">Motivo del rechazo, lo verá quien la subió</span>
          {motivos.map((x) => (
            <label key={x} className={`radio-card ${motivo === x ? "on" : ""}`}>
              <input type="radio" name="motivo" checked={motivo === x} onChange={() => setMotivo(x)} />
              {x}
            </label>
          ))}
        </div>
      )}
      {m.evidencia.tipo === "video" && (
        <p className="muted pequeno">
          <Link2 size={12} /> El enlace queda guardado con la {v.marca.s}. Si el vídeo se borra en su plataforma, la {v.marca.s} verificada conserva quién y cuándo la revisó.
        </p>
      )}
    </Gaveta>
  );
}
