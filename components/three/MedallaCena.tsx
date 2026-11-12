"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cssVar, damp, labelTexture, mount, softShadow } from "./kit";
import { colorDe } from "./piezas";

// The answer to "Subir": a medal with the result on its face swings in and settles, still
// provisional, so the ribbon is in the accent colour and not yet gold-edged.

export default function MedallaCena({ texto }: { texto: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = mount(el);
    if (!st) return;
    const { scene, renderer } = st;
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    cam.position.set(0, 0.2, 6);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0c0, 1.6));
    const sol = new THREE.DirectionalLight(0xffffff, 2.2);
    sol.position.set(2, 3, 5);
    scene.add(sol);
    const acento = colorDe(cssVar("--accent", "#c4632b"), "#c4632b");

    const g = new THREE.Group();
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.16, 48), new THREE.MeshPhongMaterial({ color: 0xd7a83c, shininess: 90, specular: 0x8a7a40 }));
    disco.rotation.x = Math.PI / 2;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 10, 48), new THREE.MeshPhongMaterial({ color: 0xb98a24, shininess: 60 }));
    const cara = new THREE.Mesh(new THREE.CircleGeometry(0.8, 48), new THREE.MeshBasicMaterial({ map: labelTexture(texto, { bg: "#fff8e8", color: "#2a2118", w: 320, h: 320, size: texto.length > 7 ? 54 : 70, radius: 160 }) }));
    cara.position.z = 0.085;
    const cinta1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.5, 0.03), new THREE.MeshLambertMaterial({ color: acento }));
    cinta1.position.set(-0.28, 1.55, -0.05);
    cinta1.rotation.z = 0.22;
    const cinta2 = cinta1.clone();
    cinta2.position.x = 0.28;
    cinta2.rotation.z = -0.22;
    g.add(disco, aro, cara, cinta1, cinta2);
    g.position.y = -0.3;
    g.scale.setScalar(0.01);
    scene.add(g);
    const sombra = softShadow(2.4, 0.9, 0.3);
    sombra.position.y = -1.55;
    scene.add(sombra);

    const chispas: THREE.Mesh[] = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), new THREE.MeshLambertMaterial({ color: i % 2 ? acento : 0xd7a83c }));
      const a = (i / 14) * Math.PI * 2;
      m.userData = { a, r: 1.5 + (i % 3) * 0.3, v: 0.4 + (i % 4) * 0.1 };
      scene.add(m);
      chispas.push(m);
    }
    const fit = (w: number, h: number) => {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    fit(st.size().w, st.size().h);
    st.onResize(fit);
    let giro = Math.PI * 3;
    const t0 = performance.now();
    st.loop((dt) => {
      const t = (performance.now() - t0) / 1000;
      giro = damp(giro, 0, 2.2, dt);
      g.rotation.y = giro + (st.reduce ? 0 : Math.sin(t * 1.2) * 0.08);
      g.scale.setScalar(damp(g.scale.x, 1, 5, dt));
      for (const c of chispas) {
        const u = c.userData as { a: number; r: number; v: number };
        const k = Math.min(1, t / 1.2);
        c.position.set(Math.cos(u.a + t * u.v) * u.r * k, Math.sin(u.a + t * u.v) * u.r * k * 0.7, -0.4);
        c.rotation.z += dt * 3;
      }
      renderer.render(scene, cam);
    });
    return () => st.dispose();
  }, [texto]);
  return <div ref={ref} className="cena-medalla" aria-hidden="true" />;
}
