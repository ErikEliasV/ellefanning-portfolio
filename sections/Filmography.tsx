import { FilmStrip } from "@/components/content/FilmStrip";
import { FILMS } from "@/lib/films";
import "@/styles/filmography.css";

const LEAD =
  "Two decades of screen work. Scroll to run the reel — titles are pulled in from the right and read out at the gate.";

export function Filmography() {
  return (
    <section id="filmography" className="border-t border-line-rule">
      <div className="film-header">
        <div className="film-header-row">
          <h2 className="film-heading">Filmography</h2>
          <p className="film-lead">{LEAD}</p>
        </div>
      </div>

      <FilmStrip films={FILMS} />

      <div className="bleed flex items-baseline justify-between gap-4 border-t border-line-hairline py-3 font-mono text-label-sm font-bold uppercase tracking-label-wide text-ink-500">
        <span>{FILMS.length} titles</span>
        <span>2001 — 2024</span>
      </div>
    </section>
  );
}
