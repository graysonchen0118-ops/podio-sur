"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cssVar, damp, labelTexture, mount, softShadow } from "./kit";
import { colorDe, objeto } from "./piezas";
import { foto } from "@/lib/photos";

// The hero: this month's top three centres on a podium, each with its own photo standing on
// top, and the objects of the instance's world floating around. Leans toward the pointer.

interface Top {
  nombre: string;
  puntos: number;
  foto: string;
}

export default function PodioCena({ top3, escena }: { top3: Top[]; escena: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const clave = top3.map((t) => `${t.nombre}:${t.puntos}`).join("|");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = mount(el);
    if (!st) return;
    const { scene, renderer } = st;
    const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x2a2f3a, 1.5));
    const sol = new THREE.DirectionalLight(0xffffff, 2.1);
    sol.position.set(-4, 8, 6);
    scene.add(sol);
    const contra = new THREE.DirectionalLight(colorDe(cssVar("--accent", "#c4632b"), "#c4632b"), 0.9);
    contra.position.set(5, 3, -4);
    scene.add(contra);

    const acento = colorDe(cssVar("--accent", "#c4632b"), "#c4632b");
    const acento2 = colorDe(cssVar("--accent-2", "#1f3a5f"), "#1f3a5f");
    const raiz = new THREE.Group();
    scene.add(raiz);

    // floating slab instead of an infinite floor
    const losa = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.24, 3.6), new THREE.MeshLambertMaterial({ color: 0x1d2433 }));
    losa.position.y = -0.12;
    raiz.add(losa);
    const borde = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.04, 3.7), new THREE.MeshLambertMaterial({ color: acento }));
    borde.position.y = 0.01;
    raiz.add(borde);

    const orden = [1, 0, 2];
    const alturas = [1.9, 1.35, 0.95];
    const xs = [-1.75, 0, 1.75];
    const colores = [acento2.clone().lerp(new THREE.Color(0xffffff), 0.15), acento, acento2.clone().lerp(new THREE.Color(0x000000), 0.15)];
    const bloques: { g: THREE.Group; h: number; k: number }[] = [];
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    orden.forEach((idx, slot) => {
      const t = top3[idx];
      const h = alturas[idx];
      const g = new THREE.Group();
      g.position.x = xs[slot];
      const bloque = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.5), new THREE.MeshLambertMaterial({ color: colores[slot] }));
      bloque.position.y = h / 2;
      g.add(bloque);
      const numero = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: labelTexture(String(idx + 1), { bg: "rgba(255,255,255,0.94)", color: "#141b2b", w: 128, h: 128, size: 78, radius: 64 }), transparent: true }));
      numero.position.set(0, Math.max(0.42, h - 0.5), 0.76);
      g.add(numero);
      if (t) {
        const marco = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.94, 0.06), new THREE.MeshLambertMaterial({ color: 0xffffff }));
        marco.position.set(0, h + 0.62, -0.1);
        marco.rotation.x = -0.12;
        g.add(marco);
        const fotoMat = new THREE.MeshBasicMaterial({ color: 0xdedad2 });
        const lamina = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.84), fotoMat);
        lamina.position.set(0, h + 0.62, -0.065);
        lamina.rotation.x = -0.12;
        g.add(lamina);
        loader.load(foto(t.foto, 420, 280), (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          fotoMat.map = tex;
          fotoMat.color.set(0xffffff);
          fotoMat.needsUpdate = true;
        });
        const nombre = t.nombre.length > 18 ? `${t.nombre.slice(0, 17)}.` : t.nombre;
        const etiqueta = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.36), new THREE.MeshBasicMaterial({ map: labelTexture(`${nombre}  ${t.puntos} pts`, { bg: "rgba(17,24,39,0.88)", color: "#ffffff", w: 512, h: 108, size: 40 }), transparent: true, depthWrite: false }));
        etiqueta.position.set(0, h + 1.32, 0.05);
        g.add(etiqueta);
      }
      const sombra = softShadow(2.4, 2.1, 0.45);
      sombra.position.y = 0.02;
      g.add(sombra);
      g.scale.y = 0.001;
      raiz.add(g);
      bloques.push({ g, h, k: slot * 0.18 });
    });

    // objects of their world, floating at different depths
    const flotan: { o: THREE.Object3D; base: THREE.Vector3; f: number }[] = [];
    const n = st.small ? 4 : 7;
    for (let i = 0; i < n; i++) {
      const o = objeto(escena, i + 1, [acento, acento2, new THREE.Color(0x2a2d34)]);
      const lugares = [
        [3.6, 2.9, -1.2],
        [4.4, 1.2, -0.6],
        [-2.6, 3.6, -3.2],
        [2.6, 3.9, -3],
        [5, 3.4, -2.6],
        [0.9, 4.2, -4],
        [-1.4, 4.4, -4.4],
      ];
      const [lx, ly, lz] = lugares[i % lugares.length];
      const base = new THREE.Vector3(lx, ly, lz);
      o.position.copy(base);
      o.rotation.set(0.6 + i, i * 0.9, 0.3);
      o.scale.setScalar(0.7);
      raiz.add(o);
      flotan.push({ o, base, f: i * 1.3 });
    }

    let ancho = false;
    const fit = (w: number, h: number) => {
      cam.aspect = w / h;
      ancho = w >= 900;
      if (ancho) cam.setViewOffset(w, h, -w * 0.22, 0, w, h);
      else cam.clearViewOffset();
      cam.updateProjectionMatrix();
    };
    fit(st.size().w, st.size().h);
    st.onResize(fit);
    const ptr = { x: 0, y: 0 };
    const sm = { x: 0, y: 0 };
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ptr.x = (e.clientX - r.left) / r.width - 0.5;
      ptr.y = (e.clientY - r.top) / r.height - 0.5;
    };
    window.addEventListener("pointermove", mover, { passive: true });
    const t0 = performance.now();

    st.loop((dt, t) => {
      const desde = (performance.now() - t0) / 1000;
      for (const b of bloques) {
        const alvo = desde > 0.3 + b.k ? 1 : 0.001;
        b.g.scale.y = damp(b.g.scale.y, alvo, 4.5, dt);
      }
      for (const f of flotan) {
        f.o.position.y = f.base.y + (st.reduce ? 0 : Math.sin(t * 0.7 + f.f) * 0.18);
        if (!st.reduce) f.o.rotation.y += dt * 0.25;
      }
      sm.x = damp(sm.x, ptr.x, 3, dt);
      sm.y = damp(sm.y, ptr.y, 3, dt);
      const giro = st.reduce ? 0 : Math.sin(t * 0.18) * 0.12;
      raiz.rotation.y = giro + sm.x * 0.35;
      const d = ancho ? 9.6 : 10.8;
      cam.position.set(sm.x * 0.8, 3.1 - sm.y * 0.8, d);
      cam.lookAt(0, 1.25, 0);
      renderer.render(scene, cam);
    });
    return () => {
      window.removeEventListener("pointermove", mover);
      st.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, escena]);
  return <div ref={ref} className="cena-podio" aria-hidden="true" />;
}
