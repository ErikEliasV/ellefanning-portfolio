"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { lockScroll } from "@/lib/scroll";

// O mesmo limiar de `NARROW_QUERY` em lib/filmStage.ts e das media queries de
// styles/characters.css e styles/footer.css. Acima dele a nav inline volta, e
// um painel aberto ficaria pendurado por cima dela -- entao a troca de
// breakpoint fecha o menu em vez de deixar os dois no ar.
const WIDE = "(width >= 64rem)";

// O que conta como parada de tabulacao dentro da armadilha. `[tabindex="-1"]`
// fica de fora de proposito: e alcancavel por script, nunca por Tab.
const STOPS = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useHeaderMenu() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((on) => !on), []);

  useEffect(() => {
    const wide = window.matchMedia(WIDE);
    const shut = () => {
      if (wide.matches) setOpen(false);
    };

    shut();
    wide.addEventListener("change", shut);

    return () => wide.removeEventListener("change", shut);
  }, []);

  useEffect(() => {
    if (!open) return;

    const panel = sheet.current;
    const trigger = button.current;

    lockScroll(true);

    // Tudo que nao e o proprio menu sai do alcance de leitor de tela e de
    // Tab enquanto o painel esta aberto. Mesma tecnica do modal do filme
    // (components/content/FilmDialog.tsx), so que aqui a arvore e rasa: o
    // botao e o painel sao filhos diretos de <body>, entao basta marcar os
    // irmaos deles. Guardar a lista e desmarcar por ela (em vez de passear
    // pela arvore de novo na limpeza) e o mesmo cuidado de la -- no desmonte
    // o painel ja pode ter saido do documento.
    const inerted: HTMLElement[] = [];
    for (const node of Array.from(document.body.children)) {
      const el = node as HTMLElement;
      if (el === panel || el.contains(trigger)) continue;
      el.setAttribute("inert", "");
      inerted.push(el);
    }

    // O primeiro link, e nao o painel: e o que o leitor de tela anuncia, e da
    // para sair no Tab seguinte sem passar por nada mudo.
    //
    // Numa tarefa a parte, e nao aqui direto: o painel fica `visibility:
    // hidden` fechado (e assim os links saem da ordem de tabulacao sem
    // precisar de `inert`), e no instante em que este efeito roda o estilo
    // novo ainda nao foi calculado -- `focus()` num elemento que o browser
    // ainda tem como invisivel e ignorado em silencio, e medido era isso que
    // acontecia: o foco ficava no botao. setTimeout e nao rAF pelo mesmo
    // motivo de components/content/FilmDialog.tsx: aba em segundo plano
    // suspende rAF, tarefa agendada nao.
    const land = window.setTimeout(() => {
      panel?.querySelector<HTMLElement>(STOPS)?.focus();
    }, 0);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      // O botao mora fora do painel (ele flutua sobre a barra de vidro, que
      // e bloco de contencao de fixed), entao a armadilha tem de somar os
      // dois -- senao Tab escaparia para o browser no ultimo link.
      const stops = [
        ...(trigger ? [trigger] : []),
        ...Array.from(panel.querySelectorAll<HTMLElement>(STOPS)),
      ];
      if (!stops.length) return;

      const first = stops[0];
      const last = stops[stops.length - 1];
      const at = document.activeElement;

      if (event.shiftKey && at === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && at === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(land);
      window.removeEventListener("keydown", onKey);
      for (const el of inerted) el.removeAttribute("inert");
      lockScroll(false);
      // Devolver o foco ao botao e o par do `focus()` la em cima: sem isto o
      // Tab seguinte recomecaria do topo do documento.
      trigger?.focus();
    };
  }, [open]);

  return { open, button, sheet, toggle, close };
}
