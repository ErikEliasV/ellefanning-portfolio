"use client";

import { useScrollbar } from "@/lib/useScrollbar";
import "@/styles/scrollbar.css";

export function Scrollbar() {
  const { rail, thumb, live, drag, onThumbDown, onThumbMove, onThumbUp, onRailDown } =
    useScrollbar();

  // aria-hidden como o cursor customizado: isto e o desenho da rolagem, nao a
  // rolagem. A nativa continua inteira -- roda, teclado, Page Up/Down, barra de
  // espaco, busca na pagina -- entao esconder a barra do leitor de tela nao
  // tira nenhuma forma de navegar.
  return (
    <div
      ref={rail}
      aria-hidden
      className="bar"
      data-live={live ? "" : undefined}
      data-drag={drag ? "" : undefined}
      onPointerDown={onRailDown}
    >
      <span
        ref={thumb}
        className="bar-thumb"
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
      />
    </div>
  );
}
