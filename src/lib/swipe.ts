// O arrasto de lado dos palcos que trocaram o scroll pelo dedo no telefone: o
// deck de Characters (lib/useCharacterDeck.ts) e o reel do editorial
// (lib/useEditorialReel.ts). Era codigo do primeiro, e saiu dali quando o
// segundo pediu o mesmo gesto -- duas copias seriam dois jeitos de decidir o
// que e toque e o que e arrasto, para manter em fase.
//
// Este modulo so sabe do DEDO: quanto ele andou e com que velocidade saiu.
// Quanto isso vale em fotos, onde assentar e o elastico das pontas sao de cada
// palco. O dedo na vertical nao chega aqui: quem o entrega ao navegador, para
// a pagina continuar rolando, e o `touch-action: pan-y` do CSS de cada palco.

// Quantos px de dedo antes de um toque virar arrasto. Abaixo disso e um toque,
// e o clique segue para o card; acima, e arrasto, e o clique que vier depois e
// engolido -- senao soltar o dedo em cima de uma foto a abriria.
const SLOP = 8;
// A constante de tempo da media da velocidade, em ms, e quanto tempo parado
// antes de soltar zera o impulso: o dedo que parou antes de sair nao tem
// impulso nenhum, por mais rapido que tenha andado antes.
const TAU = 50;
const STALE = 80;

export type SwipeHandlers = {
  /** Se um gesto pode comecar agora (perfil estreito, nada aberto por cima). */
  can: () => boolean;
  /** O toque virou arrasto. */
  start: () => void;
  /** O dedo esta `dx` px a direita de onde o arrasto comecou. */
  move: (dx: number) => void;
  /** O dedo saiu, a `velocity` px/s (positivo para a direita). */
  end: (velocity: number) => void;
};

// Liga o gesto em `el` e devolve a funcao que o desliga.
export function swipe(el: HTMLElement, on: SwipeHandlers) {
  let gesture: {
    id: number;
    from: number;
    x: number;
    at: number;
    velocity: number;
    live: boolean;
  } | null = null;
  let swallow = false;

  const grab = (event: PointerEvent) => {
    swallow = false;
    if (!event.isPrimary || !on.can()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gesture = {
      id: event.pointerId,
      from: event.clientX,
      x: event.clientX,
      at: event.timeStamp,
      velocity: 0,
      live: false,
    };
  };

  const drag = (event: PointerEvent) => {
    const g = gesture;
    if (!g || event.pointerId !== g.id) return;

    if (!g.live) {
      if (Math.abs(event.clientX - g.from) < SLOP) return;
      // Vira arrasto a partir DAQUI, e nao do toque: medir do toque faria a
      // foto pular os SLOP px de uma vez.
      g.live = true;
      g.from = event.clientX;
      g.x = event.clientX;
      g.at = event.timeStamp;
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // O ponteiro pode ja ter ido embora; o arrasto segue sem captura.
      }
      on.start();
      return;
    }

    const dt = event.timeStamp - g.at;
    if (dt > 0) {
      const v = ((event.clientX - g.x) / dt) * 1000;
      g.velocity += (v - g.velocity) * (1 - Math.exp(-dt / TAU));
    }
    g.x = event.clientX;
    g.at = event.timeStamp;
    on.move(event.clientX - g.from);
  };

  const drop = (event: PointerEvent) => {
    const g = gesture;
    if (!g || event.pointerId !== g.id) return;
    gesture = null;
    if (!g.live) return;
    swallow = event.type === "pointerup";
    on.end(event.timeStamp - g.at > STALE ? 0 : g.velocity);
  };

  const eat = (event: MouseEvent) => {
    if (!swallow) return;
    swallow = false;
    event.preventDefault();
    event.stopPropagation();
  };

  el.addEventListener("pointerdown", grab, { passive: true });
  el.addEventListener("pointermove", drag, { passive: true });
  el.addEventListener("pointerup", drop, { passive: true });
  el.addEventListener("pointercancel", drop, { passive: true });
  el.addEventListener("click", eat, true);

  return () => {
    el.removeEventListener("pointerdown", grab);
    el.removeEventListener("pointermove", drag);
    el.removeEventListener("pointerup", drop);
    el.removeEventListener("pointercancel", drop);
    el.removeEventListener("click", eat, true);
  };
}
