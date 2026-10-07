"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { lockScroll } from "@/lib/scroll";

const WIDE = "(width >= 64rem)";

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

    const inerted: HTMLElement[] = [];
    for (const node of Array.from(document.body.children)) {
      const el = node as HTMLElement;
      if (el === panel || el.contains(trigger)) continue;
      el.setAttribute("inert", "");
      inerted.push(el);
    }

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
      trigger?.focus();
    };
  }, [open]);

  return { open, button, sheet, toggle, close };
}
