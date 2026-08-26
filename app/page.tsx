import { Hero } from "@/sections/Hero";
import { Filmography } from "@/sections/Filmography";
import { Characters } from "@/sections/Characters";
import { CareerTimeline } from "@/sections/CareerTimeline";

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <Hero />
        <Filmography />
        <Characters />
        <CareerTimeline />
      </main>
    </>
  );
}
