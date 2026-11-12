import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Toasts } from "@/components/ui";
import FondoGlobal from "@/components/FondoGlobal";

const lexend = Lexend({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Podio Sur | Retos, récords y rankings de centros",
  description: "Registra tus resultados con foto o vídeo, un verificador de otro centro los revisa y tu centro sube en la clasificación del mes. Tu historial y tus récords se quedan contigo.",
  applicationName: "Podio Sur",
  appleWebApp: { capable: true, title: "Podio Sur", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#c4632b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={lexend.className}>
        <StoreProvider>
          <FondoGlobal />
          {children}
          <Toasts />
        </StoreProvider>
      </body>
    </html>
  );
}
