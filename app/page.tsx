import { Hero } from "@/sections/Hero";
import { Filmography } from "@/sections/Filmography";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Filmography />
    </main>
  );
}
