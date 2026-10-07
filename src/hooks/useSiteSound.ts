"use client";

import { useEffect, useState } from "react";
import { listen, subscribe, toggle, type SoundState } from "@/lib/audio";

const IDLE: SoundState = { on: true, live: false };

export function useSiteSound() {
  const [state, setState] = useState<SoundState>(IDLE);

  useEffect(() => {
    const release = listen();
    const drop = subscribe(setState);

    return () => {
      drop();
      release();
    };
  }, []);

  return { ...state, toggle };
}
