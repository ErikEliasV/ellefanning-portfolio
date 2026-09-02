"use client";

import { MARKS } from "@/lib/marks";
import { usePreloader } from "@/lib/usePreloader";
import "@/styles/preloader.css";

function TitleLines() {
  return (
    <>
      <span>Elle</span>
      <span>
        Fanning<span className="pre-dot">.</span>
      </span>
    </>
  );
}

export function Preloader() {
  const { plate, readout, phase } = usePreloader();

  if (phase === "done") return null;

  return (
    <>
      <noscript>
        <style>{".pre{display:none}"}</style>
      </noscript>

      <p role="status" className="sr-only">
        Loading
      </p>

      <div
        ref={plate}
        aria-hidden
        className="pre"
        data-exit={phase === "exit" ? "" : undefined}
      >
        <p className="pre-title pre-title-ink">
          <TitleLines />
        </p>

        <div className="pre-rose">
          <p className="pre-title pre-title-paper">
            <TitleLines />
          </p>
        </div>

        <div className="pre-edge" />

        <div className="pre-band">
          {MARKS.map((mark) => (
            <div key={mark.id} className="pre-mark">
              {mark.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          ))}
        </div>

        <div className="pre-foot">
          <span>Loading</span>
          <span>
            <span ref={readout} className="pre-num">
              000
            </span>{" "}
            <span className="pre-pct">%</span>
          </span>
        </div>
      </div>
    </>
  );
}
