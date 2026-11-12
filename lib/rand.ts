// Seeded random numbers, so the server render and the browser build the same mock data.
export function semilla(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const entre = (r: () => number, a: number, b: number) => a + (b - a) * r();
export const entero = (r: () => number, a: number, b: number) => Math.floor(entre(r, a, b + 1));
export const elige = <T,>(r: () => number, l: readonly T[]) => l[Math.floor(r() * l.length) % l.length];
