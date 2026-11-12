"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, Camera, Check, ChartColumn, ChevronLeft, Flame, House, ImagePlus, Link2, ListChecks, MapPin, Plus, Upload, Video } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cabecera, Pie } from "./Cabecera";
import { Avatar, EstadoTag, Foto, Spinner, Vacio } from "./ui";
import { Medalla } from "./three";
import type { Evidencia, Marca } from "@/lib/types";
import { DIA, HOY, fechaCorta, fechaHora, hora, nombrePeriodo, periodoDe } from "@/lib/fecha";
import { afiliadoTxt, cap, codigoDia, mejorPersonal, racha, ranking, versionDe, vigente } from "@/lib/calc";
import { METRICAS, UNIDADES, leer, num, ver } from "@/lib/unidades";

type Tab = "inicio" | "subir" | "historial" | "ranking";

export default function AppDeportista() {
  const { db, yo, ultima } = useStore();
  const [tab, setTab] = useState<Tab>("inicio");
  const marcaGuardada = useMemo(() => {
    if (ultima && ultima.instancia === db.config.id) return db.marcas.find((m) => m.id === ultima.marcaId);
    return yo ? db.marcas.filter((m) => m.personaId === yo.id).sort((a, b) => b.subida - a.subida)[0] : undefined;
  }, [db, ultima, yo]);

  return (
    <div className="sitio">
      <Cabecera />
      <main className="app-pagina">
        <div className="app-grid">
          <div className="telefono-wrap">
            <div className="telefono" data-tab={tab}>
              <div className="telefono-barra" aria-hidden="true">
                <span>{hora(HOY)}</span>
                <i />
              </div>
              <div className="telefono-conteudo">
                {!yo ? (
                  <AppVacia />
                ) : tab === "inicio" ? (
                  <Inicio ir={setTab} />
                ) : tab === "subir" ? (
                  <Subir ir={setTab} />
                ) : tab === "historial" ? (
                  <Historial />
                ) : (
                  <RankingApp />
                )}
              </div>
              {yo && (
                <nav className="telefono-tabs" aria-label="Secciones de la app">
                  {(
                    [
                      ["inicio", <House key="i" size={20} />, "Inicio"],
                      ["subir", <Plus key="s" size={20} />, "Subir"],
                      ["historial", <ListChecks key="h" size={20} />, "Historial"],
                      ["ranking", <ChartColumn key="r" size={20} />, "Ranking"],
                    ] as [Tab, React.ReactNode, string][]
                  ).map(([id, ic, txt]) => (
                    <button key={id} className={`tab-app ${tab === id ? "activa" : ""} ${id === "subir" ? "tab-subir" : ""}`} onClick={() => setTab(id)} aria-current={tab === id}>
                      {ic}
                      <span>{txt}</span>
                    </button>
                  ))}
                </nav>
              )}
            </div>
            <p className="telefono-pie">Se instala en el móvil desde el navegador, sin pasar por ninguna tienda de apps.</p>
          </div>
          <ComoSeGuarda m={marcaGuardada} />
        </div>
      </main>
      <Pie />
    </div>
  );
}

function AppVacia() {
  const { db, v } = useStore();
  return (
    <div className="app-pantalla">
      <Vacio
        titulo={`${db.config.nombre} acaba de nacer`}
        texto={`Base de datos ${db.config.bd} creada y vacía. Da de alta ${v.centro.p}, ${v.prueba.p} y ${v.persona.p} desde el panel y la app se llena sola.`}
        accion={
          <Link href="/panel/pruebas" className="btn btn-primario btn-pequeno">
            Ir al panel <ArrowRight size={14} />
          </Link>
        }
      />
    </div>
  );
}

function Inicio({ ir }: { ir: (t: Tab) => void }) {
  const { db, yo, v } = useStore();
  const per = yo!;
  const r = useMemo(() => racha(db, per.id), [db, per.id]);
  const centro = db.centros.find((c) => c.id === per.centroId);
  const desde = per.historial[per.historial.length - 1]?.desde;
  const mias = db.marcas.filter((m) => m.personaId === per.id).sort((a, b) => b.fecha - a.fecha);
  const pruebasMias = [...new Set(mias.map((m) => m.pruebaId))];
  const codigo = codigoDia(db.config.id, HOY);
  return (
    <div className="app-pantalla">
      <div className="app-saludo">
        <Avatar chave={per.avatar} nome={per.nombre} size={44} grupo={per.grupo} />
        <div>
          <small>Hola,</small>
          <b>{per.grupo ? per.nombre : per.nombre.split(" ")[0]}</b>
        </div>
        <span className="app-centro">
          <MapPin size={12} /> {centro?.nombre}
          {desde && per.historial.length > 1 ? ` · desde ${fechaCorta(desde)}` : ""}
        </span>
      </div>

      <div className="app-racha">
        <div className="app-racha-cab">
          <span className="app-racha-icono">
            <Flame size={20} />
          </span>
          <div>
            <b>
              {r.actual} {r.actual === 1 ? "semana" : "semanas"} seguidas
            </b>
            <small>{r.estaSemana ? "Esta semana ya cuenta." : "Sube algo antes del domingo y la mantienes."}</small>
          </div>
        </div>
        <div className="app-semanas" aria-label="Últimas diez semanas">
          {r.ultimas.map((s) => (
            <i key={s.semana} className={`${s.activa ? "on" : ""} ${s.esta ? "esta" : ""}`} title={fechaCorta(s.semana)} />
          ))}
        </div>
      </div>

      <div className="app-codigo">
        <div>
          <small>Código de hoy</small>
          <b>{codigo}</b>
        </div>
        <p>Escríbelo en un papel junto al resultado o dilo en el vídeo. Cambia cada día.</p>
      </div>

      <div className="app-bloque">
        <div className="app-bloque-cab">
          <h4>Tus mejores {v.marca.p}</h4>
        </div>
        {pruebasMias.length === 0 ? (
          <p className="muted pequeno">Aún no hay ninguna. La primera cuenta para la racha.</p>
        ) : (
          <ul className="app-mejores">
            {pruebasMias.map((pid) => {
              const p = db.pruebas.find((x) => x.id === pid)!;
              const b = mejorPersonal(db, per.id, pid);
              if (!b) return null;
              return (
                <li key={pid}>
                  <span className="app-mejores-foto">
                    <Foto chave={p.foto} w={80} h={80} alt="" />
                  </span>
                  <span>
                    <b>{p.nombre}</b>
                    <small>{fechaCorta(b.fecha)}</small>
                  </span>
                  <span className="app-mejores-val">
                    <b>{ver(b.valor, vigente(p).unidad)}</b>
                    <EstadoTag e={b.estado} g={v.marca.g} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <button className="btn btn-primario btn-bloco" onClick={() => ir("subir")}>
        <Plus size={18} /> Subir {v.marca.g === "f" ? "una" : "un"} {v.marca.s}
      </button>
    </div>
  );
}

const DIAS_ATRAS = [
  { n: 0, t: "Hoy" },
  { n: 1, t: "Ayer" },
  { n: 2, t: "Anteayer" },
];

function Subir({ ir }: { ir: (t: Tab) => void }) {
  const { db, yo, v, subirMarca, toast, ahora } = useStore();
  const per = yo!;
  const activas = db.pruebas.filter((p) => p.activa);
  const [pruebaId, setPruebaId] = useState(activas[0]?.id ?? "");
  const p = db.pruebas.find((x) => x.id === pruebaId);
  const ver_ = p ? vigente(p) : undefined;
  const [texto, setTexto] = useState("");
  const [centroId, setCentroId] = useState(per.centroId);
  const [dias, setDias] = useState(0);
  const [tipo, setTipo] = useState<"foto" | "video">("foto");
  const [fotoKey, setFotoKey] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [visible, setVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [hecha, setHecha] = useState<Marca | null>(null);
  const [tocado, setTocado] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);

  if (!p || !ver_) return <div className="app-pantalla"><Vacio titulo={`Sin ${v.prueba.p} activas`} texto="Se crean desde el panel." /></div>;
  const u = UNIDADES[ver_.unidad];
  const valor = texto ? leer(texto, ver_.unidad) : null;
  const fechaReal = dias === 0 ? ahora() : HOY - dias * DIA - 3 * 3_600_000;
  const codigo = codigoDia(db.config.id, fechaReal);
  const centro = db.centros.find((c) => c.id === centroId);
  const urlOk = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|vimeo\.com|drive\.google\.com)\/\S+$/i.test(url.trim());
  const evidenciaOk = tipo === "foto" ? !!(fotoKey || archivo) : urlOk;
  const anterior = mejorPersonal(db, per.id, p.id);
  const galeria = db.marcas.filter((m) => m.pruebaId === p.id && m.evidencia.foto).map((m) => m.evidencia.foto!);
  const fotosGal = [...new Set(galeria)].slice(0, 3);
  const listo = valor !== null && valor > 0 && evidenciaOk && visible;

  const enviar = async () => {
    setTocado(true);
    if (!listo || valor === null) return;
    setEnviando(true);
    const ev: Evidencia = tipo === "foto" ? { tipo, ...(archivo ? { archivo } : { foto: fotoKey! }), codigo, codigoVisible: visible } : { tipo, url: url.trim(), codigo, codigoVisible: visible };
    try {
      const m = await subirMarca({ pruebaId: p.id, valor, centroId, fecha: fechaReal, evidencia: ev });
      setHecha(m);
      toast(`${cap(v.marca.s)} ${v.marca.g === "f" ? "subida" : "subido"} como provisional. La revisa alguien de otro ${v.centro.s}.`);
    } finally {
      setEnviando(false);
    }
  };

  if (hecha) {
    const pp = db.pruebas.find((x) => x.id === hecha.pruebaId)!;
    const vv = versionDe(pp, hecha.version);
    const c = db.centros.find((x) => x.id === hecha.centroId);
    return (
      <div className="app-pantalla app-hecha">
        <div className="app-hecha-cena">
          <Medalla texto={ver(hecha.valor, vv.unidad)} />
        </div>
        <span className="tag tag-alerta">Provisional</span>
        <h3>{pp.nombre}</h3>
        <div className="app-hecha-valor">{ver(hecha.valor, vv.unidad)}</div>
        <p>
          {c?.afiliado ? `Cuando se verifique sumará para ${c.nombre} en ${nombrePeriodo(periodoDe(hecha.fecha)).toLowerCase()}.` : `${c?.nombre} no está ${v.centro.g === "f" ? "afiliada" : "afiliado"}: queda en tu historial, sin puntos de ranking.`} Ya cuenta para tu racha.
        </p>
        <div className="app-hecha-btns">
          <button className="btn btn-claro btn-bloco" onClick={() => ir("historial")}>
            Ver en el historial
          </button>
          <button
            className="btn btn-primario btn-bloco"
            onClick={() => {
              setHecha(null);
              setTexto("");
              setFotoKey(null);
              setArchivo(null);
              setUrl("");
              setVisible(false);
              setTocado(false);
            }}
          >
            Subir otra
          </button>
        </div>
      </div>
    );
  }

  const afiliados = db.centros.filter((c) => c.afiliado && c.id !== per.centroId);
  const otros = db.centros.filter((c) => !c.afiliado);
  return (
    <div className="app-pantalla app-subir">
      <div className="app-titulo">
        <button className="icon-btn" onClick={() => ir("inicio")} aria-label="Volver">
          <ChevronLeft size={20} />
        </button>
        <h3>Subir {v.marca.s}</h3>
      </div>

      <div className="app-campo">
        <span className="app-rot">{cap(v.prueba.s)}</span>
        <div className="app-pruebas" role="radiogroup">
          {activas.map((x) => (
            <button key={x.id} role="radio" aria-checked={x.id === pruebaId} className={`app-prueba ${x.id === pruebaId ? "activa" : ""}`} onClick={() => { setPruebaId(x.id); setTexto(""); setFotoKey(null); }}>
              <Foto chave={x.foto} w={72} h={72} alt="" />
              <span>{x.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="app-campo">
        <span className="app-rot">
          Resultado <em>en {u.nombre}</em>
        </span>
        <span className={`app-valor ${tocado && valor === null ? "error" : ""}`}>
          <input inputMode="decimal" placeholder={u.ejemplo} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label={`Resultado en ${u.nombre}`} />
          <em>{u.corto}</em>
        </span>
        <small className="app-ayuda">
          {valor !== null && valor > 0 ? (
            <>
              Se guarda como <b>{num(valor)}</b> {METRICAS.find((m) => m.id === ver_.metrica)?.base}
              {anterior ? ` · tu mejor: ${ver(anterior.valor, ver_.unidad)}` : ""}
            </>
          ) : tocado ? (
            <span className="txt-erro">Escríbelo como {u.ejemplo}</span>
          ) : (
            `${ver_.criterio === "menor" ? "Gana el valor más bajo" : "Gana el valor más alto"}. ${p.descripcion}`
          )}
        </small>
      </label>

      <div className="app-dos">
        <label className="app-campo">
          <span className="app-rot">Dónde</span>
          <select value={centroId} onChange={(e) => setCentroId(e.target.value)}>
            <option value={per.centroId}>{db.centros.find((c) => c.id === per.centroId)?.nombre} (el tuyo)</option>
            {afiliados.length > 0 && (
              <optgroup label={`Otros ${v.centro.p} ${v.centro.g === "f" ? "afiliadas" : "afiliados"}`}>
                {afiliados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </optgroup>
            )}
            {otros.length > 0 && (
              <optgroup label="Otros lugares, no compiten">
                {otros.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.ciudad})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <label className="app-campo">
          <span className="app-rot">Cuándo</span>
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {DIAS_ATRAS.map((x) => (
              <option key={x.n} value={x.n}>
                {x.t}, {fechaCorta(HOY - x.n * DIA)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {centro && !centro.afiliado && <p className="app-aviso">{centro.nombre} está {afiliadoTxt(v.centro, false)}: tu {v.marca.s} queda en tu historial y tus récords personales, pero no suma en rankings.</p>}

      <div className="app-campo">
        <span className="app-rot">Evidencia</span>
        <div className="segmento" role="tablist">
          <button role="tab" aria-selected={tipo === "foto"} className={tipo === "foto" ? "activo" : ""} onClick={() => setTipo("foto")}>
            <Camera size={15} /> Foto
          </button>
          <button role="tab" aria-selected={tipo === "video"} className={tipo === "video" ? "activo" : ""} onClick={() => setTipo("video")}>
            <Video size={15} /> Enlace de vídeo
          </button>
        </div>
        {tipo === "foto" ? (
          <div className="app-fotos">
            <button className={`app-foto-sub ${archivo ? "con" : ""}`} onClick={() => input.current?.click()}>
              {archivo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={archivo} alt="Tu foto" />
              ) : (
                <>
                  <ImagePlus size={20} />
                  <span>Hacer foto</span>
                </>
              )}
            </button>
            <input
              ref={input}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setArchivo(URL.createObjectURL(f));
                  setFotoKey(null);
                }
              }}
            />
            {fotosGal.map((k) => (
              <button key={k} className={`app-foto-gal ${fotoKey === k ? "activa" : ""}`} onClick={() => { setFotoKey(k); setArchivo(null); }} aria-label="Usar esta foto de la galería">
                <Foto chave={k} w={120} h={120} alt="" />
                {fotoKey === k && (
                  <span className="app-foto-check">
                    <Check size={14} />
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <span className={`app-url ${url && !urlOk ? "error" : ""}`}>
            <Link2 size={15} />
            <input placeholder="Pega el enlace de YouTube, Instagram o Drive" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Enlace del vídeo" />
          </span>
        )}
        {tipo === "video" && url && !urlOk && <small className="txt-erro pequeno">Ese enlace no parece un vídeo de YouTube, Instagram, TikTok, Vimeo o Drive.</small>}
        {tipo === "video" && <small className="app-ayuda">El vídeo se queda donde está: aquí solo se guarda el enlace.</small>}
        {tocado && !evidenciaOk && tipo === "foto" && <small className="txt-erro pequeno">Falta la foto.</small>}
      </div>

      <label className={`app-codigo-check ${visible ? "on" : ""} ${tocado && !visible ? "error" : ""}`}>
        <span className="app-codigo-mini">{codigo}</span>
        <span>
          <b>El código del {dias === 0 ? "día" : fechaCorta(fechaReal)} se ve en la {tipo === "foto" ? "foto" : "grabación"}</b>
          <small>{tipo === "foto" ? "En un papel junto al monitor o la báscula." : "Dicho en voz alta o escrito en un papel."}</small>
        </span>
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
      </label>

      <button className="btn btn-primario btn-bloco btn-grande" onClick={enviar} disabled={enviando}>
        {enviando ? <Spinner /> : <Upload size={18} />} {enviando ? "Subiendo" : `Subir ${v.marca.s}`}
      </button>
    </div>
  );
}

function Historial() {
  const { db, yo, v, pts } = useStore();
  const per = yo!;
  const [filtro, setFiltro] = useState<"todas" | "verificada" | "provisional" | "rechazada">("todas");
  const mias = db.marcas.filter((m) => m.personaId === per.id).sort((a, b) => b.fecha - a.fecha);
  const lista = mias.filter((m) => filtro === "todas" || m.estado === filtro);
  const grupos = new Map<string, Marca[]>();
  for (const m of lista) grupos.set(periodoDe(m.fecha), [...(grupos.get(periodoDe(m.fecha)) ?? []), m]);
  const n = (e: string) => mias.filter((m) => e === "todas" || m.estado === e).length;
  return (
    <div className="app-pantalla">
      <div className="app-titulo">
        <h3>Tu historial</h3>
        <span className="muted pequeno">{mias.length} {v.marca.p}</span>
      </div>
      <div className="chips sem-margem app-chips">
        {(
          [
            ["todas", "Todas"],
            ["verificada", v.marca.g === "f" ? "Verificadas" : "Verificados"],
            ["provisional", "Provisionales"],
            ["rechazada", v.marca.g === "f" ? "Rechazadas" : "Rechazados"],
          ] as const
        ).map(([id, t]) => (
          <button key={id} className={`chip ${filtro === id ? "activo" : ""}`} onClick={() => setFiltro(id)}>
            {t} <em>{n(id)}</em>
          </button>
        ))}
      </div>
      {lista.length === 0 ? (
        <Vacio titulo="Nada por aquí" texto="Prueba con otro filtro." />
      ) : (
        [...grupos.entries()].map(([g, ms]) => (
          <div key={g} className="app-mes">
            <h5>{nombrePeriodo(g)}</h5>
            <ul className="app-hist">
              {ms.map((m) => {
                const p = db.pruebas.find((x) => x.id === m.pruebaId)!;
                const vv = versionDe(p, m.version);
                const c = db.centros.find((x) => x.id === m.centroId);
                const pt = pts.get(m.id);
                return (
                  <li key={m.id} className={`app-hist-item ${m.estado}`}>
                    <div className="app-hist-top">
                      <b>{p.nombre}</b>
                      <span className="app-hist-val">{ver(m.valor, vv.unidad)}</span>
                    </div>
                    <div className="app-hist-meta">
                      <span>{fechaHora(m.fecha)}</span>
                      <span className={`app-hist-centro ${c?.afiliado ? "" : "no-af"}`}>
                        <MapPin size={11} /> {c?.nombre}
                        {!c?.afiliado && ` · ${afiliadoTxt(v.centro, false)}`}
                      </span>
                    </div>
                    <div className="app-hist-pie">
                      <EstadoTag e={m.estado} g={v.marca.g} />
                      {p.versiones.length > 1 && <span className="tag tag-neutro">v{m.version}</span>}
                      {m.evidencia.tipo === "video" ? <span className="tag tag-neutro"><Video size={11} /> vídeo</span> : null}
                      {pt && c?.afiliado && <span className="app-hist-pts">+{pt.puntos} {c.nombre}</span>}
                      {m.estado === "rechazada" && m.motivo && <small className="app-hist-motivo">{m.motivo}</small>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function RankingApp() {
  const { db, yo, v, pts } = useStore();
  const per = yo!;
  const p = periodoDe(HOY);
  const filas = ranking(db, p, pts);
  const pos = filas.findIndex((f) => f.centroId === per.centroId);
  const centro = db.centros.find((c) => c.id === per.centroId);
  const aporto = db.marcas.filter((m) => m.personaId === per.id && m.centroId === per.centroId && periodoDe(m.fecha) === p && m.estado === "verificada").reduce((s, m) => s + (pts.get(m.id)?.puntos ?? 0), 0);
  return (
    <div className="app-pantalla">
      <div className="app-titulo">
        <h3>{nombrePeriodo(p)}</h3>
      </div>
      {pos >= 0 && (
        <div className="app-mi-centro">
          <span className="app-mi-pos">{pos + 1}.º</span>
          <div>
            <b>{centro?.nombre}</b>
            <small>
              {filas[pos].puntos} puntos · tú has aportado {aporto}
            </small>
          </div>
          <BadgeCheck size={20} />
        </div>
      )}
      <ol className="app-ranking">
        {filas.slice(0, 8).map((f, i) => {
          const c = db.centros.find((x) => x.id === f.centroId)!;
          return (
            <li key={f.centroId} className={f.centroId === per.centroId ? "mio" : ""}>
              <span className="app-rk-pos">{i + 1}</span>
              <span className="app-rk-foto">
                <Foto chave={c.foto} w={64} h={64} alt="" />
              </span>
              <span className="app-rk-nom">{c.nombre}</span>
              <b>{f.puntos}</b>
            </li>
          );
        })}
      </ol>
      <p className="muted pequeno">Solo {v.centro.p} {v.centro.g === "f" ? "afiliadas" : "afiliados"}. Tus {v.marca.p} en otros sitios siguen en tu historial.</p>
    </div>
  );
}

/** the record the server keeps for the last mark: base value, test version, centre at that moment */
function ComoSeGuarda({ m }: { m?: Marca }) {
  const { db, v } = useStore();
  if (!m)
    return (
      <aside className="app-lado">
        <h2>Lo que guarda el servidor</h2>
        <p className="muted">Cuando haya {v.marca.p}, aquí se ve cómo queda guardada la última.</p>
      </aside>
    );
  const p = db.pruebas.find((x) => x.id === m.pruebaId)!;
  const vv = versionDe(p, m.version);
  const base = METRICAS.find((x) => x.id === vv.metrica)?.base;
  const filas: [string, string, string?][] = [
    ["id", `"${m.id}"`],
    ["prueba", `"${p.id}"`],
    ["version_prueba", String(m.version), `${vv.metrica}, ${UNIDADES[vv.unidad].nombre}, ${vv.criterio} gana`],
    ["valor_base", String(m.valor), base],
    ["se_muestra_como", `"${ver(m.valor, vv.unidad)}"`],
    ["centro_en_el_momento", `"${m.centroId}"`, "no cambia aunque la persona se mude"],
    ["estado", `"${m.estado}"`],
    ["evidencia", `{ "tipo": "${m.evidencia.tipo}", "codigo_dia": "${m.evidencia.codigo}" }`],
    ["hecha", `"${new Date(m.fecha).toISOString().slice(0, 16)}"`],
    ["base_de_datos", `"${db.config.bd}"`],
  ];
  return (
    <aside className="app-lado entra">
      <span className="mini-rot">Por dentro</span>
      <h2>Lo que guarda el servidor</h2>
      <p className="app-lado-sub">
        Tu última {v.marca.s}, tal como queda en la base de datos de {db.config.nombre}. Lo que ves en pantalla sale de aquí.
      </p>
      <pre className="codigo" aria-label="Registro guardado">
        <span className="c-l">{"{"}</span>
        {filas.map(([k, val, com]) => (
          <span key={k} className="c-fila">
            {"  "}
            <span className="c-k">&quot;{k}&quot;</span>: <span className="c-v">{val}</span>,{com && <span className="c-com">{"// "}{com}</span>}
          </span>
        ))}
        <span className="c-l">{"}"}</span>
      </pre>
      <ul className="app-lado-por">
        <li>
          <b>Valor en unidad base.</b> Se guarda {num(m.valor)} {base}, no lo que se tecleó. Cualquier {v.prueba.s} nueva se ordena con la misma consulta.
        </li>
        <li>
          <b>Versión de la {v.prueba.s}.</b> Si mañana se cambia su unidad o su regla, esta {v.marca.s} sigue leyéndose con la versión {m.version}.
        </li>
        <li>
          <b>{cap(v.centro.s)} del momento.</b> Si la persona cambia de {v.centro.s}, esta {v.marca.s} sigue sumando donde se hizo.
        </li>
      </ul>
      <Link href="/panel/verificacion" className="link-seta">
        Ver la cola de verificación <ArrowRight size={15} />
      </Link>
    </aside>
  );
}
