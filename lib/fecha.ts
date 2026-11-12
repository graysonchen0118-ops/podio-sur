// Dates are local Madrid wall-clock times stored as UTC milliseconds and always read with the
// UTC getters, so the server render and every browser print the same day and hour.
export const MIN = 60_000;
export const HORA = 60 * MIN;
export const DIA = 24 * HORA;
export const HOY = Date.UTC(2026, 10, 13, 10, 40);
export const INICIO = Date.UTC(2026, 8, 1);

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export const d = (y: number, m: number, dd: number, h = 0, mi = 0) => Date.UTC(y, m - 1, dd, h, mi);
export const periodoDe = (t: number) => {
  const x = new Date(t);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}`;
};
export const inicioPeriodo = (p: string) => {
  const [y, m] = p.split("-").map(Number);
  return Date.UTC(y, m - 1, 1);
};
export const finPeriodo = (p: string) => {
  const [y, m] = p.split("-").map(Number);
  return Date.UTC(y, m, 1) - 1;
};
export const nombrePeriodo = (p: string) => {
  const [y, m] = p.split("-").map(Number);
  const n = MESES[m - 1];
  return `${n[0].toUpperCase()}${n.slice(1)} ${y}`;
};
export const mesCorto = (p: string) => MESES[Number(p.split("-")[1]) - 1];
export const fechaCorta = (t: number) => {
  const x = new Date(t);
  return `${x.getUTCDate()} ${MESES_C[x.getUTCMonth()]}`;
};
export const fechaLarga = (t: number) => {
  const x = new Date(t);
  return `${x.getUTCDate()} de ${MESES[x.getUTCMonth()]} de ${x.getUTCFullYear()}`;
};
export const hora = (t: number) => {
  const x = new Date(t);
  return `${String(x.getUTCHours()).padStart(2, "0")}:${String(x.getUTCMinutes()).padStart(2, "0")}`;
};
export const fechaHora = (t: number) => `${fechaCorta(t)}, ${hora(t)}`;
export const diaSemana = (t: number) => DIAS[new Date(t).getUTCDay()];
export const haceTexto = (t: number, ahora = HOY) => {
  const s = ahora - t;
  if (s < HORA) return `hace ${Math.max(1, Math.round(s / MIN))} min`;
  if (s < DIA) return `hace ${Math.round(s / HORA)} h`;
  const dd = Math.round(s / DIA);
  return dd === 1 ? "ayer" : `hace ${dd} días`;
};
/** Monday 00:00 of the week that holds t */
export const semanaDe = (t: number) => {
  const x = new Date(t);
  const dow = (x.getUTCDay() + 6) % 7;
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()) - dow * DIA;
};
export const periodosDesde = (desde: number, hasta: number) => {
  const out: string[] = [];
  let p = periodoDe(desde);
  while (inicioPeriodo(p) <= hasta) {
    out.push(p);
    p = periodoDe(finPeriodo(p) + 1);
  }
  return out;
};
