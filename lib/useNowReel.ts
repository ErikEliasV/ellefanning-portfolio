"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useNowReel(count: number) {
  const frame = useRef<HTMLDivElement>(null);
  const clips = useRef<Array<HTMLVideoElement | null>>([]);
  const onScreen = useRef(false);
  const [live, setLive] = useState(0);
  const [running, setRunning] = useState(false);

  const bind = useCallback(
    (index: number) => (node: HTMLVideoElement | null) => {
      clips.current[index] = node;
    },
    [],
  );

  const advance = useCallback(() => {
    setLive((index) => (index + 1) % count);
  }, [count]);

  useEffect(() => {
    const host = frame.current;
    const node = clips.current[live];
    if (!host || !node) return;

    clips.current.forEach((clip, index) => {
      if (clip && index !== live) clip.pause();
    });

    node.muted = true;
    node.volume = 0;
    node.currentTime = 0;

    const start = () => {
      node.muted = true;
      node
        .play()
        .then(() => setRunning(true))
        .catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
        if (entry.isIntersecting) start();
        else node.pause();
      },
      { threshold: 0.12 },
    );
    observer.observe(host);

    const onVisibility = () => {
      if (document.hidden) node.pause();
      else if (onScreen.current) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [live]);

  return { frame, bind, advance, live, running };
}
