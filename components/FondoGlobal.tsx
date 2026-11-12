"use client";

import { useStore } from "@/lib/store";
import { Fondo } from "./three";

/** the backdrop layer follows the open instance: plates, paper or books */
export default function FondoGlobal() {
  const { db } = useStore();
  return <Fondo key={db.config.id} escena={db.config.escena} />;
}
