"use client";

export function smallViewportHeight(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height || window.innerHeight;
}

const SETTLE = 150;

type Watcher = () => void;

let watchers: Set<Watcher> | null = null;
let last = { w: 0, h: 0 };
let timer = 0;

function read() {
  return {
    w: document.documentElement.clientWidth,
    h: smallViewportHeight(),
  };
}

function settle() {
  const next = read();
  if (next.w === last.w && next.h === last.h) return;
  last = next;
  watchers?.forEach((fn) => fn());
}

function bump() {
  window.clearTimeout(timer);
  timer = window.setTimeout(settle, SETTLE);
}

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
