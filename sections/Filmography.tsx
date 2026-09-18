import { FilmStage } from "@/components/content/FilmStage";
import { FILMS } from "@/lib/films";
import "@/styles/filmography.css";

export function Filmography() {
  return (
    <section id="filmography" className="film-section">
      <FilmStage films={FILMS} />
    </section>
  );
}
