"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { damp, labelTexture, mount, softShadow } from "./kit";

// The architecture in one picture: one core, and one database per app, each in its own colour,
// fed by the same code. The open app's database stands raised; a new app adds a new stack.

interface Inst {
  id: string;
  nombre: string;
  bd: string;
  color: string;
  activa: boolean;
}

export default function NucleoCena({ instancias, version }: { instancias: Inst[]; version: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const datos = useRef(instancias);
  datos.current = instancias;
  const clave = `${instancias.map((i) => `${i.id}:${i.color}`).join("|")}#${version}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = mount(el);
    if (!st) return;
    const { scene, renderer } = st;
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2b3040, 1.5));
    const sol = new THREE.DirectionalLight(0xffffff, 2);
    sol.position.set(-4, 8, 6);
    scene.add(sol);
    const raiz = new THREE.Group();
    scene.add(raiz);

    // the core
    const nucleo = new THREE.Group();
    const cubo = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7), new THREE.MeshPhongMaterial({ color: 0x34425f, shininess: 40, specular: 0x445566 }));
    const tapa = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.08, 1.78), new THREE.MeshLambertMaterial({ color: 0x3a465e }));
    tapa.position.y = 0.89;
    const rotulo = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.56), new THREE.MeshBasicMaterial({ map: labelTexture(`núcleo ${version}`, { bg: "rgba(255,255,255,0.95)", color: "#111827", w: 440, h: 150, size: 60 }), transparent: true }));
    rotulo.position.z = 0.86;
    nucleo.add(cubo, tapa, rotulo);
    nucleo.position.set(0, 1.3, -1.6);
    const sCubo = softShadow(3, 3, 0.4);
    sCubo.position.set(0, 0.01, -1.6);
    raiz.add(nucleo, sCubo);

    const lista = datos.current;
    const n = lista.length;
    const pilas = lista.map((ins, i) => {
      const a = n === 1 ? 0 : -0.95 + (1.9 * i) / (n - 1);
      const x = Math.sin(a) * 3.4;
      const z = Math.cos(a) * 2.2 - 0.4;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const col = new THREE.Color(ins.color);
      for (let k = 0; k < 3; k++) {
        const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.3, 36), new THREE.MeshLambertMaterial({ color: col.clone().multiplyScalar(1 - k * 0.08) }));
        disco.position.y = 0.17 + k * 0.36;
        const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 36), new THREE.MeshLambertMaterial({ color: 0xffffff }));
        aro.position.y = 0.34 + k * 0.36;
        g.add(disco, aro);
      }
      const nombre = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.5), new THREE.MeshBasicMaterial({ map: labelTexture(ins.nombre, { bg: "rgba(17,24,39,0.9)", color: "#ffffff", w: 460, h: 120, size: 46 }), transparent: true, depthWrite: false }));
      nombre.position.y = 1.6;
      const bd = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.3), new THREE.MeshBasicMaterial({ map: labelTexture(ins.bd, { bg: "rgba(255,255,255,0.92)", color: "#3b4252", w: 400, h: 80, size: 34 }), transparent: true, depthWrite: false }));
      bd.position.y = 1.22;
      g.add(nombre, bd);
      const sombra = softShadow(1.8, 1.8, 0.35);
      sombra.position.y = 0.005;
      g.add(sombra);
      g.scale.setScalar(0.01);
      raiz.add(g);

      // the line from the core, with small packets travelling along it
      const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.7, -1.6), new THREE.Vector3(x * 0.5, 0.12, (z - 1.6) / 2), new THREE.Vector3(x, 0.2, z));
      const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 30, 0.035, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 }));
      raiz.add(tubo);
      const paquetes = [0, 0.33, 0.66].map(() => {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: col }));
        raiz.add(p);
        return p;
      });
      return { id: ins.id, g, curva, paquetes, alto: 0, k: i * 0.15 };
    });

    const fit = (w: number, h: number) => {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    fit(st.size().w, st.size().h);
    st.onResize(fit);
    const ptr = { x: 0, y: 0 };
    const sm = { x: 0, y: 0 };
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      ptr.x = (e.clientX - r.left) / r.width - 0.5;
      ptr.y = (e.clientY - r.top) / r.height - 0.5;
    };
    window.addEventListener("pointermove", mover, { passive: true });
    const t0 = performance.now();

    st.loop((dt, t) => {
      const desde = (performance.now() - t0) / 1000;
      const ins = datos.current;
      for (const p of pilas) {
        const act = ins.find((x) => x.id === p.id)?.activa;
        p.g.scale.setScalar(damp(p.g.scale.x, desde > 0.2 + p.k ? 1 : 0.01, 5, dt));
        p.alto = damp(p.alto, act ? 0.35 : 0, 4, dt);
        p.g.position.y = p.alto + (act && !st.reduce ? Math.sin(t * 2) * 0.04 : 0);
        p.paquetes.forEach((q, j) => {
          const u = st.reduce ? (j + 1) / 4 : (t * 0.35 + j / 3) % 1;
          q.position.copy(p.curva.getPoint(u));
        });
      }
      nucleo.rotation.y = st.reduce ? 0.4 : 0.4 + Math.sin(t * 0.4) * 0.15;
      sm.x = damp(sm.x, ptr.x, 3, dt);
      sm.y = damp(sm.y, ptr.y, 3, dt);
      raiz.rotation.y = sm.x * 0.4;
      cam.position.set(0, 4.2 - sm.y, 9.4);
      cam.lookAt(0, 0.8, -0.3);
      renderer.render(scene, cam);
    });
    return () => {
      window.removeEventListener("pointermove", mover);
      st.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return <div ref={ref} className="cena-nucleo" aria-hidden="true" />;
}
