"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Clock, Eye, FilePen, Lock, ScrollText, Signature } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cab, soloAdmin } from "./Shell";
import { Foto, Modal, Spinner } from "../ui";
import type { Acta, FilaRanking } from "@/lib/types";
import { HOY, INICIO, fechaCorta, fechaHora, nombrePeriodo, periodoDe, periodosDesde } from "@/lib/fecha";
import { actaDe, cap, estadoPeriodo, fechaFirma, ranking } from "@/lib/calc";

export default function Periodos() {
  const { db, v, pts, sesion, cambiarPlazo, firmarActa } = useStore();
  const admin = sesion.rol === "admin";
  const periodos = useMemo(() => periodosDesde(INICIO, HOY).reverse(), []);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [verActa, setVerActa] = useState<Acta | null>(null);
  const [firmando, setFirmando] = useState(false);
  const centros = new Map(db.centros.map((c) => [c.id, c]));
  const personas = new Map(db.personas.map((p) => [p.id, p]));
  const pendientesDe = (p: string) => db.marcas.filter((m) => m.estado === "provisional" && periodoDe(m.fecha) === p).length;

  return (
    <>
      <Cab
        titulo="Períodos y actas"
        sub={`Cada ${v.marca.s} cuenta en el mes en que se hizo. Al terminar el mes queda un plazo para verificar lo pendiente y después se firma el acta: desde ese momento esa clasificación no se reescribe, ni por una verificación tardía ni por ${v.centro.g === "f" ? "una" : "un"} ${v.centro.s} que se afilie después.`}
      />
      <div className="plazo-card entra d1">
        <span className="plazo-icono">
          <Clock size={20} />
        </span>
        <div>
          <b>Plazo de verificación tras cada fin de mes</b>
          <small>Da tiempo a los {v.verificador.p} de {v.centro.p} pequeños sin que el ranking quede abierto para siempre.</small>
        </div>
        <div className="segmento" role="radiogroup" aria-label="Plazo de verificación">
          {[7, 10, 15].map((d) => (
            <button key={d} role="radio" aria-checked={db.config.plazoDias === d} className={db.config.plazoDias === d ? "activo" : ""} disabled={!admin} title={admin ? undefined : soloAdmin} onClick={() => cambiarPlazo(d)}>
              {d} días
            </button>
          ))}
        </div>
      </div>

      <div className="periodos">
        {periodos.map((p, i) => {
          const est = estadoPeriodo(db, p);
          const acta = actaDe(db, p);
          const filas = ranking(db, p, pts);
          const pend = pendientesDe(p);
          return (
            <article key={p} className={`periodo entra periodo-${est}`} style={{ animationDelay: `${0.08 + i * 0.06}s` }}>
              <div className="periodo-cab">
                <div>
                  <h3>{nombrePeriodo(p)}</h3>
                  {est === "firmado" && acta ? (
                    <span className="tag tag-ok">
                      <Lock size={12} /> Acta firmada el {fechaCorta(acta.firmada)}
                    </span>
                  ) : est === "abierto" ? (
                    <span className="tag tag-info">
                      <CalendarCheck size={12} /> En curso
                    </span>
                  ) : (
                    <span className="tag tag-alerta">
                      <Clock size={12} /> {est === "plazo" ? `En plazo hasta el ${fechaCorta(fechaFirma(db, p))}` : "Plazo terminado, falta firmar"}
                    </span>
                  )}
                </div>
                <span className="periodo-sello" aria-hidden="true">
                  {est === "firmado" ? <Signature size={22} /> : <FilePen size={22} />}
                </span>
              </div>
              <Top filas={filas} centros={centros} />
              <div className="periodo-pie">
                {est === "firmado" && acta ? (
                  <>
                    <small>
                      {acta.totalMarcas} {v.marca.p} · firmada por {personas.get(acta.firmadaPor)?.nombre ?? "administración"} · {fechaHora(acta.firmada)}
                      {pend > 0 ? ` · ${pend} provisionales de ese mes ya no entran` : ""}
                    </small>
                    <button className="btn btn-claro btn-pequeno" onClick={() => setVerActa(acta)}>
                      <Eye size={14} /> Ver acta
                    </button>
                  </>
                ) : est === "abierto" ? (
                  <small>
                    Se cierra el último día del mes. El acta se firma el {fechaCorta(fechaFirma(db, p))}. {pend} {v.marca.p} pendientes de verificar.
                  </small>
                ) : (
                  <>
                    <small>
                      <b>{pend}</b> {v.marca.p} de {nombrePeriodo(p).split(" ")[0].toLowerCase()} siguen pendientes: si se verifican antes de firmar, entran en esta tabla.
                    </small>
                    <button className="btn btn-primario btn-pequeno" disabled={!admin} title={admin ? undefined : soloAdmin} onClick={() => setConfirmar(p)}>
                      <Signature size={14} /> Firmar acta ahora
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        aberto={!!confirmar}
        titulo={`Firmar el acta de ${confirmar ? nombrePeriodo(confirmar).toLowerCase() : ""}`}
        onFechar={() => setConfirmar(null)}
        rodape={
          <>
            <button className="btn btn-claro" onClick={() => setConfirmar(null)}>
              Esperar al plazo
            </button>
            <button
              className="btn btn-primario"
              disabled={firmando}
              onClick={async () => {
                if (!confirmar) return;
                setFirmando(true);
                await firmarActa(confirmar);
                setFirmando(false);
                setConfirmar(null);
              }}
            >
              {firmando ? <Spinner /> : <Signature size={16} />} Firmar
            </button>
          </>
        }
      >
        {confirmar && (
          <>
            <p className="modal-txt">
              Se guarda la clasificación tal como está ahora, con quién firma y cuándo. Después, una {v.marca.s} de {nombrePeriodo(confirmar).split(" ")[0].toLowerCase()} que se verifique contará en el historial y en los récords, pero esta tabla ya no se mueve.
            </p>
            {pendientesDe(confirmar) > 0 && (
              <p className="aviso-linea fuerte">
                Quedan {pendientesDe(confirmar)} {v.marca.p} pendientes de ese mes. Si firmas ahora, no entran. El plazo termina el {fechaCorta(fechaFirma(db, confirmar))}.
              </p>
            )}
          </>
        )}
      </Modal>

      <Modal aberto={!!verActa} titulo={verActa ? `Acta de ${nombrePeriodo(verActa.periodo).toLowerCase()}` : ""} onFechar={() => setVerActa(null)} largura={620}>
        {verActa && (
          <>
            <div className="acta-cab">
              <ScrollText size={18} />
              <div>
                <b>
                  Firmada el {fechaHora(verActa.firmada)} por {personas.get(verActa.firmadaPor)?.nombre ?? "administración"}
                </b>
                <small>
                  {verActa.totalMarcas} {v.marca.p} {v.marca.g === "f" ? "verificadas" : "verificados"} · {verActa.ranking.length} {v.centro.p} · {db.config.nombre}
                </small>
              </div>
            </div>
            <table className="tabla tabla-acta">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{cap(v.centro.s)}</th>
                  <th className="der">{cap(v.marca.p)}</th>
                  <th className="der">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {verActa.ranking.map((f, i) => (
                  <tr key={f.centroId}>
                    <td>{i + 1}</td>
                    <td>{centros.get(f.centroId)?.nombre ?? f.centroId}</td>
                    <td className="der num">{f.marcas}</td>
                    <td className="der num">
                      <b>{f.puntos}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Modal>
    </>
  );
}

function Top({ filas, centros }: { filas: FilaRanking[]; centros: Map<string, { nombre: string; foto: string }> }) {
  const max = Math.max(1, ...filas.map((f) => f.puntos));
  return (
    <ol className="periodo-top">
      {filas.slice(0, 5).map((f, i) => {
        const c = centros.get(f.centroId);
        return (
          <li key={f.centroId}>
            <span className="periodo-pos">{i + 1}</span>
            <span className="periodo-foto">{c && <Foto chave={c.foto} w={56} h={56} alt="" />}</span>
            <span className="periodo-nom">{c?.nombre}</span>
            <span className="periodo-barra">
              <i style={{ width: `${(f.puntos / max) * 100}%` }} />
            </span>
            <b>{f.puntos}</b>
          </li>
        );
      })}
      {filas.length === 0 && <li className="muted pequeno">Sin datos todavía.</li>}
    </ol>
  );
}
