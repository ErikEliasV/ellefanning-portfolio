"use client";

import { asset } from "@/lib/asset";
import { PLATE, usePreloader } from "@/lib/usePreloader";
import "@/styles/preloader.css";

export function Preloader() {
  const { plate, readout, phase } = usePreloader();

  if (phase === "done") return null;

  return (
    <>
      <noscript>
        <style>{".pre{display:none}"}</style>
      </noscript>

      <p role="status" className="sr-only">
        {phase === "loading" ? "Loading" : "Ready"}
      </p>

      <div
        ref={plate}
        className="pre"
        data-exit={phase === "exit" ? "" : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="pre-plate"
          src={asset(PLATE)}
          fetchPriority="high"
          decoding="async"
        />

        <p aria-hidden className="pre-name">
          Elle Fanning
        </p>

        <p aria-hidden className="pre-count">
          <span ref={readout} className="pre-num">
            <span className="num-cell">0</span>
            <span className="num-cell">0</span>
            <span className="num-cell">0</span>
          </span>
          %
        </p>
      </div>
    </>
  );
}
