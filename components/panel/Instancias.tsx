"use client";

import { useState } from "react";
import { ArrowUpCircle, Check, CheckCircle2, Code2, Database, ExternalLink, HardDrive, Layers, Plus, Rocket, Server, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cab, soloAdmin } from "./Shell";
import { IconoMarca } from "../Cabecera";
import { Campo, Modal, Spinner } from "../ui";
import { Nucleo } from "../three";
import type { Config, Vocabulario } from "@/lib/types";
import { fechaCorta } from "@/lib/fecha";
import { cap } from "@/lib/calc";
import { num } from "@/lib/unidades";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PRESETS: Record<string, { titulo: string; nombre: string; lema: string; sublema: string; escena: Config["escena"]; vocab: Vocabulario; color: number }> = {
  deporte: {
    titulo: "Deporte", nombre: "Podio Norte", lema: "Tu marca suma para tu centro.", sublema: "Retos, récords y rankings de centros deportivos.", escena: "discos", color: 3,
    vocab: { persona: { s: "deportista", p: "deportistas", g: "m" }, centro: { s: "centro", p: "centros", g: "m" }, prueba: { s: "prueba", p: "pruebas", g: "f" }, marca: { s: "marca", p: "marcas", g: "f" }, verificador: { s: "verificador", p: "verificadores", g: "m" } },
  },
  reciclaje: {
    titulo: "Reciclaje", nombre: "Kilo Verde Aljarafe", lema: "Cada kilo cuenta para tu colegio.", sublema: "Campañas de reciclaje entre colegios.", escena: "papel", color: 1,
    vocab: { persona: { s: "clase", p: "clases", g: "f" }, centro: { s: "colegio", p: "colegios", g: "m" }, prueba: { s: "campaña", p: "campañas", g: "f" }, marca: { s: "entrega", p: "entregas", g: "f" }, verificador: { s: "coordinador", p: "coordinadores", g: "m" } },
  },
  lectura: {
    titulo: "Lectura", nombre: "Lectores Sur", lema: "Cada libro cuenta para tu biblioteca.", sublema: "Retos de lectura entre bibliotecas de barrio.", escena: "libros", color: 2,
    vocab: { persona: { s: "lector", p: "lectores", g: "m" }, centro: { s: "biblioteca", p: "bibliotecas", g: "f" }, prueba: { s: "reto", p: "retos", g: "m" }, marca: { s: "lectura", p: "lecturas", g: "f" }, verificador: { s: "bibliotecario", p: "bibliotecarios", g: "m" } },
  },
};

const COLORES = [
  { acento: "#c4632b", acentoFuerte: "#9a4718", acento2: "#1f3a5f", oscuro: "#111827", suave: "#fbeee3" },
  { acento: "#2f7a4f", acentoFuerte: "#205a39", acento2: "#a87a3d", oscuro: "#11241a", suave: "#e3f1e7" },
  { acento: "#4a4fb5", acentoFuerte: "#353a8f", acento2: "#c08a3e", oscuro: "#141633", suave: "#e8e9f8" },
  { acento: "#1f6f8b", acentoFuerte: "#155267", acento2: "#d08a3a", oscuro: "#0f1e26", suave: "#e1eff4" },
  { acento: "#8c2f4b", acentoFuerte: "#6c2238", acento2: "#3b6e8f", oscuro: "#1e1016", suave: "#f6e5ea" },
  { acento: "#a9781f", acentoFuerte: "#7f5912", acento2: "#2c4a63", oscuro: "#1c160c", suave: "#f6eedb" },
];

const slug = (s: string, sep: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, sep).replace(new RegExp(`^\\${sep}|\\${sep}$`, "g"), "");

function configTexto(c: Config) {
  return [
    ["id", `"${c.id}"`],
    ["nombre", `"${c.nombre}"`],
    ["base_de_datos", `"${c.bd}"`],
    ["servidor", `"${c.servidor}"`],
    ["nucleo", `"${c.version}"`],
    ["color_principal", `"${c.colores.acento}"`],
    ["vocabulario", `{ "persona": "${c.vocab.persona.s}", "centro": "${c.vocab.centro.s}", "prueba": "${c.vocab.prueba.s}", "marca": "${c.vocab.marca.s}" }`],
    ["puntos", `{ "marca": ${c.reglas.puntosMarca}, "mejora": ${c.reglas.puntosMejora}, "record_centro": ${c.reglas.puntosRecordCentro} }`],
    ["plazo_verificacion_dias", String(c.plazoDias)],
    ["copias_de_seguridad", `"${c.copias}"`],
  ];
}

export default function Instancias() {
  const { dbs, orden, activa, sesion, cambiarInstancia } = useStore();
  const admin = sesion.rol === "admin";
  const [verCfg, setVerCfg] = useState<string | null>(null);
  const [crear, setCrear] = useState(false);
  const [actualizar, setActualizar] = useState(false);
  const versiones = orden.map((id) => dbs[id].config.version);
  const version = versiones.sort()[versiones.length - 1];
  const cfg = verCfg ? dbs[verCfg]?.config : undefined;

  return (
    <>
      <Cab
        titulo="Instancias"
        sub="Cada app es el mismo núcleo con su configuración y su propia base de datos: otra marca, otros usuarios, otros datos. Entre las apps de abajo no cambia ni una línea de código, solo el archivo de configuración."
        accion={
          <>
            <button className="btn btn-claro" onClick={() => setActualizar(true)} disabled={!admin} title={admin ? undefined : soloAdmin}>
              <ArrowUpCircle size={17} /> Actualizar núcleo
            </button>
            <button className="btn btn-primario" onClick={() => setCrear(true)} disabled={!admin} title={admin ? undefined : soloAdmin}>
              <Plus size={17} /> Crear instancia
            </button>
          </>
        }
      />
      <div className="nucleo-top entra d1">
        <div className="nucleo-cena">
          <Nucleo instancias={orden.map((id) => ({ id, nombre: dbs[id].config.nombre, bd: dbs[id].config.bd, color: dbs[id].config.colores.acento, activa: id === activa }))} version={version} />
        </div>
        <div className="nucleo-resumen">
          <span className="mini-rot">Núcleo {version}</span>
          <h2>
            {orden.length} apps, {orden.length} bases de datos, un solo código
          </h2>
          <ul className="nucleo-lista">
            <li>
              <Code2 size={16} />
              <span>
                <b>Comparten</b> el código, las reglas de verificación, los permisos por rol y cada mejora del núcleo.
              </span>
            </li>
            <li>
              <Database size={16} />
              <span>
                <b>No comparten</b> usuarios, {`registros`}, fotos, marca ni configuración. Cada base de datos vive sola.
              </span>
            </li>
            <li>
              <ShieldCheck size={16} />
              <span>
                <b>Todo a tu nombre:</b> repositorio, servidor, bases de datos y cuentas. Si otro desarrollador continúa, recibe el repositorio y la guía, nada más.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="inst-grid">
        {orden.map((id, i) => {
          const d = dbs[id];
          const c = d.config;
          return (
            <article key={id} className={`inst-card entra ${id === activa ? "activa" : ""}`} style={{ animationDelay: `${0.1 + i * 0.07}s`, ["--inst" as string]: c.colores.acento }}>
              <div className="inst-cab">
                <span className="inst-icono">
                  <IconoMarca c={c} size={20} />
                </span>
                <div>
                  <h3>{c.nombre}</h3>
                  <small>{c.lema}</small>
                </div>
                {id === activa && (
                  <span className="tag tag-ok">
                    <Check size={12} /> abierta
                  </span>
                )}
              </div>
              <dl className="inst-datos">
                <div>
                  <dt>
                    <Database size={13} /> Base de datos
                  </dt>
                  <dd>{c.bd}</dd>
                </div>
                <div>
                  <dt>
                    <Server size={13} /> Servidor
                  </dt>
                  <dd>{c.servidor}</dd>
                </div>
                <div>
                  <dt>
                    <Layers size={13} /> Núcleo
                  </dt>
                  <dd>{c.version}</dd>
                </div>
                <div>
                  <dt>
                    <HardDrive size={13} /> Copias
                  </dt>
                  <dd>{c.copias}</dd>
                </div>
              </dl>
              <div className="inst-nums">
                <span>
                  <b>{num(d.personas.length)}</b> personas
                </span>
                <span>
                  <b>{d.centros.length}</b> {c.vocab.centro.p}
                </span>
                <span>
                  <b>{d.pruebas.length}</b> {c.vocab.prueba.p}
                </span>
                <span>
                  <b>{num(d.marcas.length)}</b> {c.vocab.marca.p}
                </span>
              </div>
              <div className="inst-vocab">
                {cap(c.vocab.persona.s)} · {c.vocab.centro.s} · {c.vocab.prueba.s} · {c.vocab.marca.s}
                <small>creada el {fechaCorta(c.creada)}</small>
              </div>
              <div className="inst-btns">
                <button className="btn btn-claro btn-pequeno" onClick={() => setVerCfg(id)}>
                  <Code2 size={14} /> Configuración
                </button>
                <button className="btn btn-primario btn-pequeno" disabled={id === activa} onClick={() => cambiarInstancia(id)}>
                  <ExternalLink size={14} /> {id === activa ? "Abierta" : "Abrir"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <Modal aberto={!!cfg} titulo={cfg ? `Configuración de ${cfg.nombre}` : ""} onFechar={() => setVerCfg(null)} largura={680}>
        {cfg && (
          <>
            <p className="modal-txt">Esto es todo lo que distingue a {cfg.nombre} de las otras apps. El resto es el mismo núcleo.</p>
            <pre className="codigo">
              <span className="c-l">{"{"}</span>
              {configTexto(cfg).map(([k, val]) => (
                <span key={k} className="c-fila">
                  {"  "}
                  <span className="c-k">&quot;{k}&quot;</span>: <span className="c-v">{val}</span>,
                </span>
              ))}
              <span className="c-l">{"}"}</span>
            </pre>
          </>
        )}
      </Modal>
      <Crear abierto={crear} onCerrar={() => setCrear(false)} version={version} />
      <Actualizar abierto={actualizar} onCerrar={() => setActualizar(false)} version={version} />
    </>
  );
}

function Crear({ abierto, onCerrar, version }: { abierto: boolean; onCerrar: () => void; version: string }) {
  const { dbs, crearInstancia, cambiarInstancia } = useStore();
  const [preset, setPreset] = useState("lectura");
  const [nombre, setNombre] = useState(PRESETS.lectura.nombre);
  const [lema, setLema] = useState(PRESETS.lectura.lema);
  const [color, setColor] = useState(PRESETS.lectura.color);
  const [servidor, setServidor] = useState("UE, Alemania");
  const [pasos, setPasos] = useState<number>(-1);
  const [creada, setCreada] = useState<string | null>(null);
  const pr = PRESETS[preset];
  const id = slug(nombre, "-");
  const bd = slug(nombre, "_");
  const existe = !!dbs[id];
  const cfg: Config = {
    id, nombre: nombre.trim(), lema: lema.trim(), sublema: pr.sublema, bd, servidor, version, creada: 0,
    colores: COLORES[color], vocab: pr.vocab, reglas: { puntosMarca: 10, puntosMejora: 5, puntosRecordCentro: 10 }, plazoDias: 7, escena: pr.escena, copias: "Diarias, se guardan 30 días",
  };
  const PASOS = [`Base de datos ${bd} creada en ${servidor.replace("UE, ", "")}`, `Migraciones del núcleo ${version} aplicadas`, "Marca, colores y vocabulario cargados", "Cuenta de administración creada"];
  const cerrar = () => {
    if (pasos >= 0 && !creada) return;
    setPasos(-1);
    setCreada(null);
    onCerrar();
  };
  const elegir = (k: string) => {
    setPreset(k);
    setNombre(PRESETS[k].nombre);
    setLema(PRESETS[k].lema);
    setColor(PRESETS[k].color);
  };
  const lanzar = async () => {
    if (nombre.trim().length < 3 || existe) return;
    for (let i = 0; i < PASOS.length; i++) {
      setPasos(i);
      await espera(750);
    }
    setPasos(PASOS.length);
    const nuevo = await crearInstancia(cfg);
    setCreada(nuevo);
  };
  return (
    <Modal
      aberto={abierto}
      titulo="Crear instancia"
      onFechar={cerrar}
      largura={720}
      rodape={
        creada ? (
          <>
            <button className="btn btn-claro" onClick={cerrar}>
              Quedarme aquí
            </button>
            <button
              className="btn btn-primario"
              onClick={() => {
                cambiarInstancia(creada);
                cerrar();
              }}
            >
              <Rocket size={16} /> Abrir {cfg.nombre}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-claro" onClick={cerrar} disabled={pasos >= 0}>
              Cancelar
            </button>
            <button className="btn btn-primario" onClick={lanzar} disabled={pasos >= 0 || nombre.trim().length < 3 || existe}>
              {pasos >= 0 ? <Spinner /> : <Plus size={16} />} Crear {nombre.trim() || "instancia"}
            </button>
          </>
        )
      }
    >
      {pasos < 0 ? (
        <>
          <div className="campo">
            <span className="campo-rotulo">Punto de partida</span>
            <div className="presets">
              {Object.entries(PRESETS).map(([k, p]) => (
                <button key={k} className={`preset ${preset === k ? "on" : ""}`} onClick={() => elegir(k)}>
                  <b>{p.titulo}</b>
                  <small>
                    {p.vocab.persona.p}, {p.vocab.centro.p}, {p.vocab.prueba.p}
                  </small>
                </button>
              ))}
            </div>
          </div>
          <div className="form-grade">
            <Campo rotulo="Nombre de la app" error={existe ? "Ya hay una instancia con ese nombre" : nombre.trim().length < 3 ? "Al menos 3 letras" : undefined}>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </Campo>
            <Campo rotulo="Servidor">
              <select value={servidor} onChange={(e) => setServidor(e.target.value)}>
                <option>UE, Alemania</option>
                <option>UE, Finlandia</option>
              </select>
            </Campo>
          </div>
          <Campo rotulo="Lema de la portada">
            <input value={lema} onChange={(e) => setLema(e.target.value)} />
          </Campo>
          <div className="campo">
            <span className="campo-rotulo">Color principal</span>
            <div className="colores">
              {COLORES.map((c, i) => (
                <button key={c.acento} className={`color ${color === i ? "on" : ""}`} style={{ background: c.acento }} onClick={() => setColor(i)} aria-label={`Color ${c.acento}`}>
                  {color === i && <Check size={15} />}
                </button>
              ))}
            </div>
          </div>
          <pre className="codigo codigo-mini">
            {configTexto({ ...cfg, creada: 0 })
              .slice(0, 7)
              .map(([k, val]) => (
                <span key={k} className="c-fila">
                  <span className="c-k">&quot;{k}&quot;</span>: <span className="c-v">{val}</span>
                </span>
              ))}
          </pre>
        </>
      ) : (
        <div className="pasos-crear">
          {PASOS.map((p, i) => (
            <div key={p} className={`paso-crear ${pasos > i ? "hecho" : pasos === i ? "activo" : ""}`}>
              <span>{pasos > i ? <CheckCircle2 size={18} /> : pasos === i ? <Spinner size={16} /> : <i />}</span>
              {p}
            </div>
          ))}
          {creada && (
            <p className="aviso-linea">
              {cfg.nombre} existe y está vacía: su base de datos no ve nada de las otras apps. Al abrirla, la web, la app y el panel ya hablan de {cfg.vocab.persona.p}, {cfg.vocab.centro.p} y {cfg.vocab.prueba.p}.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function Actualizar({ abierto, onCerrar, version }: { abierto: boolean; onCerrar: () => void; version: string }) {
  const { dbs, orden, fijarVersion, toast } = useStore();
  const [estado, setEstado] = useState<Record<string, number>>({});
  const [corriendo, setCorriendo] = useState(false);
  const partes = version.split(".").map(Number);
  const siguiente = `${partes[0]}.${partes[1]}.${partes[2] + 1}`;
  const todas = orden.every((id) => dbs[id].config.version === siguiente);
  const PASOS = ["Copia de seguridad", "Migraciones", "Comprobación"];
  const lanzar = async () => {
    setCorriendo(true);
    for (const id of orden) {
      for (let p = 1; p <= PASOS.length; p++) {
        setEstado((e) => ({ ...e, [id]: p }));
        await espera(520);
      }
      fijarVersion(id, siguiente);
      setEstado((e) => ({ ...e, [id]: PASOS.length + 1 }));
    }
    setCorriendo(false);
    toast(`Núcleo ${siguiente} en las ${orden.length} apps. Cada base de datos se migró por separado, con su copia antes.`);
  };
  return (
    <Modal
      aberto={abierto}
      titulo={`Actualizar el núcleo a ${todas ? version : siguiente}`}
      onFechar={() => !corriendo && (setEstado({}), onCerrar())}
      largura={620}
      rodape={
        <>
          <button className="btn btn-claro" onClick={() => { setEstado({}); onCerrar(); }} disabled={corriendo}>
            Cerrar
          </button>
          <button className="btn btn-primario" onClick={lanzar} disabled={corriendo || todas}>
            {corriendo ? <Spinner /> : <ArrowUpCircle size={16} />} {todas ? "Todas al día" : `Actualizar las ${orden.length}`}
          </button>
        </>
      }
    >
      <p className="modal-txt">Una mejora del núcleo llega a todas las apps con una sola orden. Cada una hace antes su copia de seguridad y migra su propia base de datos; si una falla, las demás no se tocan.</p>
      <div className="act-lista">
        {orden.map((id) => {
          const c = dbs[id].config;
          const p = estado[id] ?? 0;
          return (
            <div key={id} className={`act-fila ${p > PASOS.length ? "hecha" : p ? "activa" : ""}`}>
              <span className="act-punto" style={{ background: c.colores.acento }} />
              <b>{c.nombre}</b>
              <small>{c.bd}</small>
              <span className="act-estado">
                {p > PASOS.length ? (
                  <>
                    <CheckCircle2 size={15} /> {c.version}
                  </>
                ) : p ? (
                  <>
                    <Spinner size={13} /> {PASOS[p - 1]}
                  </>
                ) : (
                  c.version
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
