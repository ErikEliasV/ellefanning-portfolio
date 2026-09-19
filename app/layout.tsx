import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import localFont from "next/font/local";
import { Cursor } from "@/components/core/Cursor";
import { ScrollBoot } from "@/components/core/ScrollBoot";
import { Preloader } from "@/components/core/Preloader";
import { Scrollbar } from "@/components/core/Scrollbar";
import { SoundToggle } from "@/components/core/SoundToggle";
import "@/styles/globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nature = localFont({
  variable: "--font-nature",
  display: "swap",
  src: [
    { path: "../public/fonts/ZTNature-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/ZTNature-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/ZTNature-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/ZTNature-Bold.woff2", weight: "700", style: "normal" },
  ],
});

const oskon = localFont({
  variable: "--font-oskon",
  display: "swap",
  src: [{ path: "../public/fonts/ZTBrosOskon90s-Regular.woff2", weight: "400", style: "normal" }],
});

export const metadata: Metadata = {
  title: "Elle Fanning — Actress & Producer",
  description:
    "Editorial portfolio of Elle Fanning: filmography, characters, editorials and current work.",
};

// Sem `viewportFit: "cover"` o `env(safe-area-inset-*)` devolve 0 em qualquer
// aparelho, e os elementos fixos (a barra do header, o painel do menu, o pill
// de musica) nao tem como desviar do notch nem da faixa de gestos. Nada de
// `maximumScale` ou `userScalable`: o zoom continua disponivel.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f3e9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${archivo.variable} ${nature.variable} ${oskon.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <ScrollBoot />
        <Preloader />
        <Cursor />
        <Scrollbar />
        <SoundToggle />
        {children}
      </body>
    </html>
  );
}
