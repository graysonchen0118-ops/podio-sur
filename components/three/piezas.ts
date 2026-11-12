import * as THREE from "three";

// The small objects of each instance's world, shared by the backdrop and the hero:
// bumper plates for the gyms, cardboard and paper for recycling, books for reading.

export function disco(color: THREE.ColorRepresentation, r = 0.9, h = 0.2) {
  const g = new THREE.Group();
  const goma = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40, 1), new THREE.MeshLambertMaterial({ color }));
  const borde = new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, h * 0.12, 6, 40), new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.72) }));
  borde.rotation.x = Math.PI / 2;
  borde.position.y = h / 2 + 0.005;
  const borde2 = borde.clone();
  borde2.position.y = -h / 2 - 0.005;
  const buje = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.24, r * 0.24, h * 1.15, 24), new THREE.MeshPhongMaterial({ color: 0xc9ccd2, shininess: 90, specular: 0x666666 }));
  const agujero = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.11, r * 0.11, h * 1.2, 16), new THREE.MeshBasicMaterial({ color: 0x1b1d22 }));
  g.add(goma, borde, borde2, buje, agujero);
  return g;
}

export function caja(color: THREE.ColorRepresentation, w = 1, h = 0.7, d = 0.8) {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  const cinta = new THREE.Mesh(new THREE.BoxGeometry(w * 1.01, h * 0.12, d * 1.01), new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.8) }));
  cinta.position.y = h * 0.18;
  g.add(cuerpo, cinta);
  return g;
}

export function hoja(color: THREE.ColorRepresentation = 0xf6f3ea) {
  return new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.012, 1.25), new THREE.MeshLambertMaterial({ color }));
}

export function libro(color: THREE.ColorRepresentation) {
  const g = new THREE.Group();
  const tapa = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.22), new THREE.MeshLambertMaterial({ color }));
  const paginas = new THREE.Mesh(new THREE.BoxGeometry(0.74, 1.04, 0.2), new THREE.MeshLambertMaterial({ color: 0xf4efe2 }));
  paginas.position.x = 0.04;
  g.add(tapa, paginas);
  return g;
}

/** one object of the instance's world, picked by index so the mix is varied */
export function objeto(escena: string, i: number, colores: THREE.ColorRepresentation[]) {
  const c = colores[i % colores.length];
  if (escena === "papel") return i % 3 === 0 ? hoja() : i % 3 === 1 ? caja(0xb48a5a, 0.9, 0.6, 0.7) : caja(c, 0.7, 0.5, 0.6);
  if (escena === "libros") return libro(c);
  return disco(c, 0.6 + (i % 3) * 0.18, 0.16 + (i % 2) * 0.05);
}

export function colorDe(css: string, fallback: string) {
  try {
    return new THREE.Color(css.trim() || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}
