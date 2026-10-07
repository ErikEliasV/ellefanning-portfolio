const SLOP = 8;
const TAU = 50;
const STALE = 80;

export type SwipeHandlers = {
  can: () => boolean;
  start: () => void;
  move: (dx: number) => void;
  end: (velocity: number) => void;
};

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
      g.live = true;
      g.from = event.clientX;
      g.x = event.clientX;
      g.at = event.timeStamp;
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
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
