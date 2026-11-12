"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cssVar, damp, labelTexture, mount, softShadow } from "./kit";
import { colorDe } from "./piezas";

// This month's ranking as columns. When a mark is verified, its centre's column grows and a
// medal drops onto it: the 3D answer to the verifier's click.

interface Fila {
  id: string;
  nombre: string;
  puntos: number;
}

export default function RankingCena({ filas, pulso }: { filas: Fila[]; pulso: { centroId: string; t: number } | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const datos = useRef({ filas, pulso });
  datos.current = { filas, pulso };
  const ids = filas.map((f) => f.id).join("|");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = mount(el);
    if (!st) return;
    const { scene, renderer } = st;
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc8ba, 1.7));
    const sol = new THREE.DirectionalLight(0xffffff, 1.8);
    sol.position.set(-3, 7, 6);
    scene.add(sol);
    const acento = colorDe(cssVar("--accent", "#c4632b"), "#c4632b");
    const acento2 = colorDe(cssVar("--accent-2", "#1f3a5f"), "#1f3a5f");
    const raiz = new THREE.Group();
    scene.add(raiz);
    const base = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.16, 2.2), new THREE.MeshLambertMaterial({ color: 0xece6da }));
    base.position.y = -0.08;
    raiz.add(base);

    const lista = datos.current.filas;
    const n = Math.max(1, lista.length);
    const paso = 8 / n;
    const cols = lista.map((f, i) => {
      const g = new THREE.Group();
      g.position.x = -4 + paso / 2 + i * paso;
      const mat = new THREE.MeshLambertMaterial({ color: i === 0 ? acento : acento2.clone().lerp(new THREE.Color(0xffffff), 0.12 + i * 0.07) });
      const col = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.62, 1, 0.9), mat);
      col.position.y = 0.5;
      g.add(col);
      const corto = f.nombre.length > 14 ? `${f.nombre.slice(0, 13)}.` : f.nombre;
      const nom = new THREE.Mesh(new THREE.PlaneGeometry(paso * 0.95, paso * 0.95 * 0.22), new THREE.MeshBasicMaterial({ map: labelTexture(corto, { bg: "rgba(255,255,255,0)", color: "#3b4252", w: 360, h: 80, size: 34 }), transparent: true, depthWrite: false }));
      nom.position.set(0, 0.02, 0.62);
      nom.rotation.x = -Math.PI / 2.6;
      g.add(nom);
      const sombra = softShadow(paso * 0.95, 1.4, 0.3);
      sombra.position.y = 0.005;
      g.add(sombra);
      raiz.add(g);
      return { id: f.id, g, col, alto: 0.01, pts: -1, etiqueta: null as THREE.Mesh | null, salto: 0 };
    });

    const medalla = new THREE.Group();
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 32), new THREE.MeshPhongMaterial({ color: 0xd8a93b, shininess: 80, specular: 0x887744 }));
    disco.rotation.x = Math.PI / 2;
    const cinta = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.02), new THREE.MeshLambertMaterial({ color: acento }));
    cinta.position.y = 0.42;
    medalla.add(disco, cinta);
    medalla.visible = false;
    raiz.add(medalla);
    let caida: { col: (typeof cols)[number]; t: number } | null = null;
    let ultimoPulso = datos.current.pulso?.t ?? 0;

    const fit = (w: number, h: number) => {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    fit(st.size().w, st.size().h);
    st.onResize(fit);
    const ptr = { x: 0 };
    const sm = { x: 0 };
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      ptr.x = (e.clientX - r.left) / r.width - 0.5;
    };
    window.addEventListener("pointermove", mover, { passive: true });

    st.loop((dt, t) => {
      const { filas: fs, pulso } = datos.current;
      const max = Math.max(1, ...fs.map((f) => f.puntos));
      for (const c of cols) {
        const f = fs.find((x) => x.id === c.id);
        const pts = f?.puntos ?? 0;
        const alvo = 0.25 + (pts / max) * 2.6;
        c.alto = damp(c.alto, alvo, 3.2, dt);
        c.salto = damp(c.salto, 0, 3, dt);
        c.col.scale.y = c.alto * (1 + c.salto * 0.12);
        c.col.position.y = (c.alto * (1 + c.salto * 0.12)) / 2;
        if (pts !== c.pts) {
          c.pts = pts;
          if (c.etiqueta) {
            c.g.remove(c.etiqueta);
            (c.etiqueta.material as THREE.MeshBasicMaterial).map?.dispose();
            (c.etiqueta.material as THREE.Material).dispose();
            c.etiqueta.geometry.dispose();
          }
          const e = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.36), new THREE.MeshBasicMaterial({ map: labelTexture(String(pts), { bg: "#111827", color: "#ffffff", w: 200, h: 80, size: 44 }), transparent: true, depthWrite: false }));
          c.etiqueta = e;
          c.g.add(e);
        }
        if (c.etiqueta) c.etiqueta.position.set(0, c.col.scale.y + 0.32, 0.2);
      }
      if (pulso && pulso.t !== ultimoPulso) {
        ultimoPulso = pulso.t;
        const c = cols.find((x) => x.id === pulso.centroId);
        if (c) {
          c.salto = 1;
          caida = { col: c, t: 0 };
          medalla.visible = true;
        }
      }
      if (caida) {
        caida.t += dt;
        const top = caida.col.col.scale.y + 0.75;
        const y = Math.max(top, 4.2 - caida.t * caida.t * 9);
        medalla.position.set(caida.col.g.position.x, y, 0.2);
        medalla.rotation.y += dt * 7;
        if (caida.t > 2.2) {
          medalla.visible = false;
          caida = null;
        }
      }
      sm.x = damp(sm.x, ptr.x, 3, dt);
      raiz.rotation.y = -0.28 + sm.x * 0.3 + (st.reduce ? 0 : Math.sin(t * 0.3) * 0.04);
      cam.position.set(0, 3.4, 10.4);
      cam.lookAt(0, 1.2, 0);
      renderer.render(scene, cam);
    });
    return () => {
      window.removeEventListener("pointermove", mover);
      st.dispose();
    };
  }, [ids]);
  return <div ref={ref} className="cena-ranking" aria-hidden="true" />;
}
