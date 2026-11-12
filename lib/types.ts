import type { Criterio, Metrica, UnidadId } from "./unidades";

export type Genero = "f" | "m";
export interface Palabra {
  s: string;
  p: string;
  g: Genero;
}
export interface Vocabulario {
  persona: Palabra;
  centro: Palabra;
  prueba: Palabra;
  marca: Palabra;
  verificador: Palabra;
}

export interface Config {
  id: string;
  nombre: string;
  lema: string;
  sublema: string;
  bd: string;
  servidor: string;
  version: string;
  creada: number;
  colores: { acento: string; acentoFuerte: string; acento2: string; oscuro: string; suave: string };
  vocab: Vocabulario;
  reglas: { puntosMarca: number; puntosMejora: number; puntosRecordCentro: number };
  plazoDias: number;
  escena: "discos" | "papel" | "libros";
  copias: string;
}

export interface VersionPrueba {
  v: number;
  metrica: Metrica;
  unidad: UnidadId;
  criterio: Criterio;
  definicion: string;
  /** versions that only change the unit keep the same scale, so their records continue */
  escala: number;
  desde: number;
  motivo?: string;
}

export interface Prueba {
  id: string;
  nombre: string;
  descripcion: string;
  foto: string;
  activa: boolean;
  versiones: VersionPrueba[];
  creada: number;
}

export interface Centro {
  id: string;
  nombre: string;
  barrio: string;
  ciudad: string;
  foto: string;
  afiliado: boolean;
  afiliadoDesde?: number;
  /** when it affiliated mid-period: do its earlier marks enter the open period, or only records */
  politica?: "records" | "periodo";
}

export type Rol = "usuario" | "verificador" | "admin";

export interface Persona {
  id: string;
  nombre: string;
  avatar: string;
  /** a class or group shown with a photo of the place instead of a face */
  grupo?: boolean;
  rol: Rol;
  centroId: string;
  alta: number;
  historial: { centroId: string; desde: number }[];
}

export type Estado = "provisional" | "verificada" | "rechazada";

export interface Evidencia {
  tipo: "foto" | "video";
  foto?: string;
  archivo?: string;
  url?: string;
  codigo: string;
  codigoVisible: boolean;
}

export interface Marca {
  id: string;
  personaId: string;
  pruebaId: string;
  version: number;
  valor: number;
  centroId: string;
  fecha: number;
  subida: number;
  estado: Estado;
  evidencia: Evidencia;
  verificadaPor?: string;
  verificadaEl?: number;
  motivo?: string;
}

export interface FilaRanking {
  centroId: string;
  puntos: number;
  marcas: number;
  personas: number;
}

export interface Acta {
  periodo: string;
  firmada: number;
  firmadaPor: string;
  ranking: FilaRanking[];
  totalMarcas: number;
}

export interface Db {
  config: Config;
  centros: Centro[];
  personas: Persona[];
  pruebas: Prueba[];
  marcas: Marca[];
  actas: Acta[];
}

export interface Toast {
  id: number;
  texto: string;
  tom: "ok" | "erro" | "alerta" | "info";
}
