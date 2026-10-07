import { FilmStage } from "@/components/filmography/FilmStage";
import { FILMS } from "@/data/films";
import "@/styles/filmography.css";

export function Filmography() {
  return (
    <section id="filmography" className="film-section">
      <FilmStage films={FILMS} />
    </section>
  );
}
