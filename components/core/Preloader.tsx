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
  const { plate, readout, gate, phase, enter } = usePreloader();

  if (phase === "done") return null;

  const open = phase === "ready";

  return (
    <>
      <noscript>
        <style>{".pre{display:none}"}</style>
      </noscript>

      <p role="status" className="sr-only">
        {open ? "Ready" : "Loading"}
      </p>

      <div
        ref={plate}
        className="pre"
        data-ready={open ? "" : undefined}
        data-exit={phase === "exit" ? "" : undefined}
      >
        <p aria-hidden className="pre-title pre-title-ink">
          <TitleLines />
        </p>

        <div aria-hidden className="pre-rose">
          <p className="pre-title pre-title-paper">
            <TitleLines />
          </p>
        </div>

        <div aria-hidden className="pre-edge" />

        <div aria-hidden className="pre-band">
          {MARKS.map((mark) => (
            <div key={mark.id} className="pre-mark">
              {mark.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          ))}
        </div>

        <div className="pre-gate">
          <button
            ref={gate}
            type="button"
            className="pre-enter"
            disabled={!open}
            onClick={enter}
          >
            Enter
          </button>
        </div>

        <div aria-hidden className="pre-foot">
          <span>{open ? "Ready" : "Loading"}</span>
          <span>
            <span ref={readout} className="pre-num">
              <span className="num-cell">0</span>
              <span className="num-cell">0</span>
              <span className="num-cell">0</span>
            </span>{" "}
            <span className="pre-pct">%</span>
          </span>
        </div>
      </div>
    </>
  );
}
