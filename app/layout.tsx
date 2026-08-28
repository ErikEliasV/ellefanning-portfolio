import type { Metadata } from "next";
import { Anton, Space_Mono, Archivo } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Elle Fanning — Actress & Producer",
  description:
    "Editorial portfolio of Elle Fanning: filmography, characters, editorials and current work.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceMono.variable} ${archivo.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Preloader />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
