import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import localFont from "next/font/local";
import { Cursor } from "@/components/layout/Cursor";
import { ScrollBoot } from "@/components/layout/ScrollBoot";
import { Preloader } from "@/components/layout/Preloader";
import { Scrollbar } from "@/components/layout/Scrollbar";
import { SoundToggle } from "@/components/layout/SoundToggle";
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
    { path: "./fonts/ZTNature-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/ZTNature-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ZTNature-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ZTNature-Bold.woff2", weight: "700", style: "normal" },
  ],
});

const oskon = localFont({
  variable: "--font-oskon",
  display: "swap",
  src: [{ path: "./fonts/ZTBrosOskon90s-Regular.woff2", weight: "400", style: "normal" }],
});

export const metadata: Metadata = {
  title: "Elle Fanning — Actress & Producer",
  description:
    "Editorial portfolio of Elle Fanning: filmography, characters, editorials and current work.",
};

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
