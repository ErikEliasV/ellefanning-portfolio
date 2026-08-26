import { Hero } from "@/sections/Hero";
import { Filmography } from "@/sections/Filmography";
import { Characters } from "@/sections/Characters";
import { CareerTimeline } from "@/sections/CareerTimeline";
import { Editorial } from "@/sections/Editorial";
import { BehindTheScenes } from "@/sections/BehindTheScenes";
import { CurrentProjects } from "@/sections/CurrentProjects";
import { SiteFooter } from "@/sections/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <Hero />
        <Filmography />
        <Characters />
        <CareerTimeline />
        <Editorial />
        <BehindTheScenes />
        <CurrentProjects />
      </main>
      <SiteFooter />
    </>
  );
}
