import { Hero } from "@/sections/Hero";
import { Filmography } from "@/sections/Filmography";
import { Characters } from "@/sections/Characters";
import { Editorial } from "@/sections/Editorial";
import { Now } from "@/sections/Now";
import { SiteFooter } from "@/sections/SiteFooter";
import { SiteHeader } from "@/sections/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Hero />
        <Filmography />
        <Characters />
        <Editorial />
        <Now />
      </main>
      <SiteFooter />
    </>
  );
}
