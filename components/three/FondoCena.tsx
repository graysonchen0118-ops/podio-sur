"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cssVar, damp, mount } from "./kit";
import { colorDe, objeto } from "./piezas";

// A fixed layer behind the whole site: objects of the instance's world drifting at different
// depths, moving against the scroll and leaning toward the pointer. Pure decoration, never
// in front of a control.

export default function FondoCena({ escena }: { escena: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = mount(el);
    if (!st) return;
    const { scene, renderer } = st;
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
    cam.position.set(0, 0, 14);
    scene.fog = new THREE.Fog(colorDe(cssVar("--bg", "#f7f4ef"), "#f7f4ef"), 10, 30);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c4, 1.6));
    const sol = new THREE.DirectionalLight(0xffffff, 1.4);
    sol.position.set(4, 6, 8);
    scene.add(sol);

    const colores = [colorDe(cssVar("--accent", "#c4632b"), "#c4632b"), colorDe(cssVar("--accent-2", "#1f3a5f"), "#1f3a5f"), new THREE.Color(0x2a2d34), colorDe(cssVar("--accent-soft", "#fbeee3"), "#fbeee3").multiplyScalar(0.92)];
    const n = st.small ? 7 : 12;
    const piezas: { o: THREE.Object3D; base: THREE.Vector3; giro: THREE.Vector3; prof: number; fase: number }[] = [];
    for (let i = 0; i < n; i++) {
      const o = objeto(escena, i, colores);
      const lado = i % 2 === 0 ? -1 : 1;
      const prof = 0.3 + ((i * 37) % 10) / 10;
      const base = new THREE.Vector3(lado * (5 + ((i * 53) % 40) / 10), 6 - i * (st.small ? 2.6 : 1.7), -4 - prof * 8);
      o.position.copy(base);
      o.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      scene.add(o);
      piezas.push({ o, base, giro: new THREE.Vector3(0.05 + (i % 3) * 0.03, 0.08 + (i % 4) * 0.02, 0.03), prof, fase: i * 1.7 });
    }

    const fit = (w: number, h: number) => {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    fit(st.size().w, st.size().h);
    st.onResize(fit);
    const ptr = { x: 0, y: 0 };
    const sm = { x: 0, y: 0, s: 0 };
    const mover = (e: PointerEvent) => {
      ptr.x = e.clientX / window.innerWidth - 0.5;
      ptr.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", mover, { passive: true });

    st.loop((dt, t) => {
      const sc = window.scrollY / Math.max(1, window.innerHeight);
      sm.x = damp(sm.x, ptr.x, 2.5, dt);
      sm.y = damp(sm.y, ptr.y, 2.5, dt);
      sm.s = damp(sm.s, sc, 4, dt);
      for (const p of piezas) {
        const deriva = st.reduce ? 0 : Math.sin(t * 0.35 + p.fase) * 0.35;
        // objects wrap around vertically, so a long page always has a few in view
        const R = 24;
        const y = p.base.y + sm.s * (2 + p.prof * 3.2) + deriva;
        p.o.position.set(p.base.x + sm.x * p.prof * 1.6, ((((y + R / 2) % R) + R) % R) - R / 2, p.base.z);
        if (!st.reduce) {
          p.o.rotation.x += p.giro.x * dt;
          p.o.rotation.y += p.giro.y * dt;
        }
      }
      cam.position.x = sm.x * 0.8;
      cam.position.y = -sm.y * 0.6;
      cam.lookAt(0, 0, -6);
      renderer.render(scene, cam);
    });
    return () => {
      window.removeEventListener("pointermove", mover);
      st.dispose();
    };
  }, [escena]);
  return <div ref={ref} className="fondo-cena" aria-hidden="true" />;
}
