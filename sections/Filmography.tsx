import { FilmStrip } from "@/components/content/FilmStrip";
import { FILMS } from "@/lib/films";
import "@/styles/filmography.css";

export function Filmography() {
  return (
    <section id="filmography" className="film-section">
      <FilmStrip films={FILMS} heading="Filmography" span="2001 — 2026" />
    </section>
  );
}
