import { Hero } from "@/sections/Hero";
import { Filmography } from "@/sections/Filmography";
import { Characters } from "@/sections/Characters";
import { Editorial } from "@/sections/Editorial";
import { CurrentProjects } from "@/sections/CurrentProjects";
import { SiteFooter } from "@/sections/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <Hero />
        <Filmography />
        <Characters />
        <Editorial />
        <CurrentProjects />
      </main>
      <SiteFooter />
    </>
  );
}
