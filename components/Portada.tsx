"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Award, BadgeCheck, Camera, CalendarCheck, Crown, Layers, MapPin, ScrollText, ShieldCheck, Smartphone, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cabecera, Pie } from "./Cabecera";
import { Avatar, Foto, ListaSkel, Numero, Tilt, useCargando } from "./ui";
import { Podio } from "./three";
import { HOY, INICIO, fechaCorta, nombrePeriodo, periodoDe, periodosDesde } from "@/lib/fecha";
import { afiliadoTxt, cap, estadoPeriodo, fechaFirma, actaDe, ranking, records, versionDe } from "@/lib/calc";
import { UNIDADES, criterioCorto, num, ver } from "@/lib/unidades";

export default function Portada() {
  const { db, v, pts } = useStore();
  const cargando = useCargando(700);
  const periodos = useMemo(() => periodosDesde(INICIO, HOY).reverse(), []);
  const [periodo, setPeriodo] = useState(periodoDe(HOY));
  const filas = useMemo(() => ranking(db, periodo, pts), [db, periodo, pts]);
  const actual = useMemo(() => ranking(db, periodoDe(HOY), pts), [db, pts]);
  const recs = useMemo(() => records(db), [db]);
  const centros = new Map(db.centros.map((c) => [c.id, c]));
  const personas = new Map(db.personas.map((p) => [p.id, p]));
  const noAfiliados = db.centros.filter((c) => !c.afiliado);
  const verificadas = db.marcas.filter((m) => m.estado === "verificada").length;
  const est = estadoPeriodo(db, periodo);
  const acta = actaDe(db, periodo);
  const max = Math.max(1, ...filas.map((f) => f.puntos));
  const top3 = actual.slice(0, 3).map((f) => ({ nombre: centros.get(f.centroId)?.nombre ?? "", puntos: f.puntos, foto: centros.get(f.centroId)?.foto ?? "" }));
  const vacia = db.pruebas.length === 0 || db.centros.length === 0;

  return (
    <div className="sitio">
      <Cabecera />
      <main className="portada">
        <section className="hero">
          <div className="hero-cena">{!vacia && <Podio key={db.config.id} top3={top3} escena={db.config.escena} />}</div>
          <div className="hero-in">
            <div className="hero-txt entra">
              <span className="hero-chip">
                <span className="ponto-vivo" /> {nombrePeriodo(periodoDe(HOY))} en curso · {db.centros.filter((c) => c.afiliado).length} {v.centro.p} compitiendo
              </span>
              <h1>{db.config.lema}</h1>
              <p>{db.config.sublema}</p>
              <div className="hero-cta">
                <Link href="/app" className="btn btn-primario btn-grande">
                  <Smartphone size={18} /> Subir {v.marca.g === "f" ? "una" : "un"} {v.marca.s}
                </Link>
                <a href="#clasificacion" className="btn btn-vidrio btn-grande">
                  Ver la clasificación <ArrowRight size={17} />
                </a>
              </div>
              <div className="hero-datos">
                <div>
                  <b>{num(verificadas)}</b>
                  <span>{v.marca.p} {v.marca.g === "f" ? "verificadas" : "verificados"}</span>
                </div>
                <div>
                  <b>{db.personas.filter((p) => p.rol === "usuario").length}</b>
                  <span>{v.persona.p}</span>
                </div>
                <div>
                  <b>{db.pruebas.filter((p) => p.activa).length}</b>
                  <span>{v.prueba.p} activas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="seccion" id="clasificacion">
          <div className="seccion-cab">
            <div>
              <span className="mini-rot">Clasificación de {v.centro.p}</span>
              <h2>Quién lidera {periodo === periodoDe(HOY) ? "este mes" : nombrePeriodo(periodo).toLowerCase()}</h2>
              <p className="seccion-sub">Cada {v.marca.s} {v.marca.g === "f" ? "verificada" : "verificado"} suma para {art2(v.centro.g)} {v.centro.s} donde se hizo, en el mes en que se hizo.</p>
            </div>
            <div className="chips sem-margem" role="tablist" aria-label="Período">
              {periodos.map((p) => (
                <button key={p} role="tab" aria-selected={p === periodo} className={`chip ${p === periodo ? "activo" : ""}`} onClick={() => setPeriodo(p)}>
                  {nombrePeriodo(p)}
                </button>
              ))}
            </div>
          </div>
          <div className="estado-periodo">
            {est === "firmado" && acta ? (
              <span className="tag tag-ok">
                <ScrollText size={13} /> Acta firmada el {fechaCorta(acta.firmada)}: esta tabla ya no cambia
              </span>
            ) : est === "abierto" ? (
              <span className="tag tag-info">
                <CalendarCheck size={13} /> En curso. Se cierra el último día del mes y el acta se firma el {fechaCorta(fechaFirma(db, periodo))}
              </span>
            ) : (
              <span className="tag tag-alerta">
                <CalendarCheck size={13} /> Mes cerrado, en plazo de verificación hasta el {fechaCorta(fechaFirma(db, periodo))}
              </span>
            )}
          </div>
          {cargando ? (
            <ListaSkel n={6} h={62} />
          ) : filas.length === 0 ? (
            <div className="vacio">
              <strong>Todavía no hay {v.centro.p} {v.centro.g === "f" ? "afiliadas" : "afiliados"}</strong>
              <p>Se dan de alta desde el panel, sin tocar código.</p>
            </div>
          ) : (
            <ol className="ranking">
              {filas.map((f, i) => {
                const c = centros.get(f.centroId);
                if (!c) return null;
                return (
                  <li key={f.centroId} className={`ranking-fila entra ${i < 3 ? "top" : ""}`} style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}>
                    <span className={`ranking-pos pos-${i + 1}`}>{i === 0 ? <Crown size={16} /> : i + 1}</span>
                    <span className="ranking-foto">
                      <Foto chave={c.foto} w={96} h={96} alt={c.nombre} />
                    </span>
                    <span className="ranking-nombre">
                      <b>{c.nombre}</b>
                      <small>
                        <MapPin size={12} /> {c.barrio}
                        {c.ciudad !== "Sevilla" && c.ciudad !== c.barrio ? `, ${c.ciudad}` : ""}
                      </small>
                    </span>
                    <span className="ranking-barra" aria-hidden="true">
                      <i style={{ width: `${(f.puntos / max) * 100}%` }} />
                    </span>
                    <span className="ranking-num">
                      <b>{f.marcas}</b>
                      <small>{v.marca.p}</small>
                    </span>
                    <span className="ranking-num ranking-num2">
                      <b>{f.personas}</b>
                      <small>{v.persona.p}</small>
                    </span>
                    <span className="ranking-pts">
                      <b>
                        <Numero valor={f.puntos} formato={(x) => num(Math.round(x))} />
                      </b>
                      <small>puntos</small>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          {noAfiliados.length > 0 && (
            <p className="nota-no-afiliados">
              <ShieldCheck size={15} /> {noAfiliados.map((c) => c.nombre).join(", ")}: {noAfiliados.length === 1 ? afiliadoTxt(v.centro, false) : v.centro.g === "f" ? "no afiliadas" : "no afiliados"}. Sus {v.marca.p} cuentan en el historial de cada {v.persona.s}, no en esta tabla.
            </p>
          )}
        </section>

        <section className="seccion seccion-alt" id="records">
          <div className="seccion-cab">
            <div>
              <span className="mini-rot">Récords históricos</span>
              <h2>Lo mejor de cada {v.prueba.s}, desde el primer día</h2>
              <p className="seccion-sub">Separados de la clasificación del mes: un récord no caduca cuando cambia el mes.</p>
            </div>
          </div>
          {cargando ? (
            <ListaSkel n={3} h={150} />
          ) : recs.length === 0 ? (
            <div className="vacio">
              <strong>Sin récords todavía</strong>
              <p>Aparecen con {art2(v.marca.g)} primer{v.marca.g === "f" ? "a" : ""} {v.marca.s} {v.marca.g === "f" ? "verificada" : "verificado"}.</p>
            </div>
          ) : (
            <div className="records">
              {recs.map((r, i) => {
                const p = personas.get(r.marca.personaId);
                const c = centros.get(r.marca.centroId);
                const vm = versionDe(r.prueba, r.marca.version);
                return (
                  <Tilt key={`${r.prueba.id}-${r.version.escala}`} className="record entra" max={5}>
                    <div className="record-foto">
                      <Foto chave={r.prueba.foto} w={520} h={260} alt={r.prueba.nombre} />
                      <span className="record-tipo">
                        <Award size={13} /> {criterioCorto(r.version.criterio)}
                      </span>
                      {r.prueba.versiones.length > 1 && <span className="record-v">v{r.version.v}</span>}
                    </div>
                    <div className="record-cuerpo" style={{ animationDelay: `${i * 0.05}s` }}>
                      <h3>{r.prueba.nombre}</h3>
                      <div className="record-valor">{ver(r.marca.valor, r.version.unidad)}</div>
                      {p && (
                        <div className="record-quien">
                          <Avatar chave={p.avatar} nome={p.nombre} size={30} grupo={p.grupo} />
                          <span>
                            <b>{p.nombre}</b>
                            <small>
                              {c?.nombre} · {fechaCorta(r.marca.fecha)}
                              {vm.unidad !== r.version.unidad ? ` · subida en ${UNIDADES[vm.unidad].nombre}` : ""}
                            </small>
                          </span>
                        </div>
                      )}
                      <ol className="record-top">
                        {r.top.slice(1).map((m, k) => (
                          <li key={m.id}>
                            <span>{k + 2}</span>
                            <em>{personas.get(m.personaId)?.nombre}</em>
                            <b>{ver(m.valor, r.version.unidad)}</b>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </Tilt>
                );
              })}
            </div>
          )}
        </section>

        <section className="seccion" id="como">
          <div className="seccion-cab">
            <div>
              <span className="mini-rot">Cómo funciona</span>
              <h2>Tres pasos, siempre con la misma regla</h2>
            </div>
          </div>
          <div className="pasos">
            {[
              { i: <Camera size={20} />, t: `Subes tu ${v.marca.s}`, d: `Con foto o enlace de vídeo y el código del día escrito al lado. Queda como provisional y ya cuenta para tu racha semanal.`, f: db.pruebas[0]?.foto ?? "gym-1" },
              { i: <BadgeCheck size={20} />, t: `${cap(v.verificador.s)} de otro ${v.centro.s}`, d: `Nadie valida ${v.marca.p} de su propio ${v.centro.s}. Compara la evidencia con el código del día y la verifica o explica por qué no.`, f: db.centros[1]?.foto ?? "gym-2" },
              { i: <Trophy size={20} />, t: `Suma para tu ${v.centro.s}`, d: `En el mes en que la hiciste, aunque se verifique después. Cuando el acta del mes se firma, esa tabla ya no se toca.`, f: db.centros[0]?.foto ?? "gym-3" },
            ].map((s, k) => (
              <Tilt key={k} className="paso entra" max={4}>
                <div className="paso-foto">
                  <Foto chave={s.f} w={600} h={340} alt="" />
                  <span className="paso-n">{k + 1}</span>
                </div>
                <div className="paso-txt">
                  <span className="paso-icono">{s.i}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Tilt>
            ))}
          </div>
          <div className="reglas" id="reglas">
            <div>
              <span className="mini-rot">Reglas de puntuación</span>
              <h3>Claras, públicas y las mismas para todos</h3>
            </div>
            <ul>
              <li>
                <b>+{db.config.reglas.puntosMarca}</b> por cada {v.marca.s} {v.marca.g === "f" ? "verificada" : "verificado"}, para {art2(v.centro.g)} {v.centro.s} donde se hizo.
              </li>
              <li>
                <b>+{db.config.reglas.puntosMejora}</b> si mejora tu mejor {v.marca.s} anterior en esa {v.prueba.s}.
              </li>
              <li>
                <b>+{db.config.reglas.puntosRecordCentro}</b> si es la mejor que se ha hecho nunca en ese {v.centro.s}.
              </li>
              <li>
                <b>0</b> las provisionales: se ven en tu historial y mantienen la racha, pero no puntúan.
              </li>
            </ul>
          </div>
        </section>

        <section className="banda-nucleo">
          <div className="banda-in">
            <span className="banda-icono">
              <Layers size={22} />
            </span>
            <div>
              <h3>El mismo núcleo mueve otras apps</h3>
              <p>Otra marca, otro vocabulario y otra base de datos, sin tocar el código. Abre la otra instancia desde el selector de arriba o mira cómo se crea una nueva.</p>
            </div>
            <Link href="/panel/instancias" className="btn btn-claro">
              Ver instancias <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Pie />
    </div>
  );
}

const art2 = (g: "f" | "m") => (g === "f" ? "la" : "el");
