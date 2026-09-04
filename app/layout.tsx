import type { Metadata } from "next";
import { Anton, Space_Mono, Archivo } from "next/font/google";
import localFont from "next/font/local";
import { Cursor } from "@/components/core/Cursor";
import { Preloader } from "@/components/core/Preloader";
import "@/styles/globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceMono.variable} ${archivo.variable} ${nature.variable} ${oskon.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Preloader />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
