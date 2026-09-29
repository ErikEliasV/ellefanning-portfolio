"use client";

// A geometria da viewport, num lugar so.
//
// Antes disto, `smallViewportHeight()` vivia copiada em quatro hooks (hero,
// filmografia, editorial e characters), cada um com o mesmo comentario dizendo
// que o lugar dela era um modulo comum -- e cada um se inscrevendo por conta
// propria em `resize` e/ou num ResizeObserver do documentElement.

// A altura de "small viewport": a que o `100svh` do CSS usa, ou seja, a tela
// com a barra de endereco do celular ABERTA.
//
// Sonda com um elemento fora de tela em vez de ler `innerHeight` porque os
// dois discordam justamente no caso que interessa: `innerHeight` acompanha a
// barra recolhendo, `100svh` nao. Os palcos sticky do site sao todos
// dimensionados em svh, entao medir por `innerHeight` os faria pular a cada
// rolagem no telefone. O `|| window.innerHeight` e o caminho de reserva para
// quem nao entende a unidade.
export function smallViewportHeight(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height || window.innerHeight;
}

// Arrastar a janela no desktop dispara dezenas de `resize` por segundo, e cada
// assinante daqui remede layout, reescreve custom properties e (no caso da
// hero) reconstroi malha de WebGL. 150ms e curto o bastante para a janela
// parecer acompanhar a mao e longo o bastante para o arrasto inteiro custar
// uma medicao so.
const SETTLE = 150;

type Watcher = () => void;

let watchers: Set<Watcher> | null = null;
let last = { w: 0, h: 0 };
let timer = 0;

function read() {
  return {
    // clientWidth e nao innerWidth: o segundo inclui a calha da barra de
    // rolagem nativa, e o resto do projeto ja mede pelo primeiro.
    w: document.documentElement.clientWidth,
    h: smallViewportHeight(),
  };
}

function settle() {
  const next = read();
  // O filtro da barra de endereco. No celular, rolar recolhe e expande a barra
  // de URL, e isso dispara `resize` com a largura intacta E com a altura de
  // small viewport intacta -- e `innerHeight` que se mexe, e ninguem aqui mede
  // por ele. Refazer a conta devolveria exatamente os mesmos numeros, e no
  // caminho reconstruiria geometria a cada rolagem. Girar o aparelho muda as
  // duas medidas, entao passa.
  if (next.w === last.w && next.h === last.h) return;
  last = next;
  watchers?.forEach((fn) => fn());
}

function bump() {
  window.clearTimeout(timer);
  timer = window.setTimeout(settle, SETTLE);
}

// Quem depende da geometria da viewport se inscreve aqui em vez de ouvir
// `resize` direto. Devolve a funcao de cancelamento, e o ultimo a sair apaga a
// luz -- nenhum ouvinte fica pendurado no window depois que a secao desmonta.
export function onViewport(fn: Watcher): () => void {
  if (!watchers) {
    watchers = new Set();
    last = read();
    window.addEventListener("resize", bump);
    window.addEventListener("orientationchange", bump);
  }

  watchers.add(fn);

  return () => {
    if (!watchers) return;
    watchers.delete(fn);
    if (watchers.size) return;
    window.clearTimeout(timer);
    window.removeEventListener("resize", bump);
    window.removeEventListener("orientationchange", bump);
    watchers = null;
  };
}
