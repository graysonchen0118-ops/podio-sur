"use client";

import dynamic from "next/dynamic";

// Every scene loads on the client only, with a quiet placeholder in the palette while the
// WebGL code arrives, and that placeholder stays if WebGL is not available.
const Espera = ({ className }: { className?: string }) => <div className={`cena-espera ${className ?? ""}`} aria-hidden="true" />;

export const Fondo = dynamic(() => import("./FondoCena"), { ssr: false, loading: () => null });
export const Podio = dynamic(() => import("./PodioCena"), { ssr: false, loading: () => <Espera className="cena-podio" /> });
export const RankingVivo = dynamic(() => import("./RankingCena"), { ssr: false, loading: () => <Espera className="cena-ranking" /> });
export const Medalla = dynamic(() => import("./MedallaCena"), { ssr: false, loading: () => <Espera className="cena-medalla" /> });
export const Nucleo = dynamic(() => import("./NucleoCena"), { ssr: false, loading: () => <Espera className="cena-nucleo" /> });
