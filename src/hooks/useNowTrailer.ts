"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hush } from "@/lib/audio";

const GESTURES = ["pointerdown", "keydown", "touchstart"] as const;

function mayPlaySound() {
  return navigator.userActivation?.hasBeenActive ?? false;
}

export function useNowTrailer() {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const onScreen = useRef(false);
  const wanted = useRef(true);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [near, setNear] = useState(false);

  const raise = useCallback(() => {
    const node = video.current;
    if (!node) return;
    node.muted = false;
    node.volume = 1;
  }, []);

  useEffect(() => {
    const host = frame.current;
    const node = video.current;
    if (!host || !node) return;

    node.muted = true;

    const play = () => {
      if (!onScreen.current || document.hidden) return;
      node.muted = !(wanted.current && mayPlaySound());
      node.play().catch(() => {
        if (node.muted) return;
        node.muted = true;
        node.play().catch(() => {});
      });
    };
    const halt = () => node.pause();

    const onReady = () => setReady(true);
    const onPlaying = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVolume = () => setSound(!node.muted);

    node.addEventListener("canplay", onReady);
    node.addEventListener("playing", onPlaying);
    node.addEventListener("pause", onPause);
    node.addEventListener("volumechange", onVolume);

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
        setNear(entry.isIntersecting);
        if (entry.isIntersecting) play();
        else halt();
      },
      { threshold: 0.12 },
    );
    observer.observe(host);

    const onVisibility = () => {
      if (document.hidden) halt();
      else if (onScreen.current) play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onGesture = (event: Event) => {
      if (!wanted.current || !onScreen.current) return;
      const from = event.target instanceof Element ? event.target : null;
      if (from?.closest(".now-sound")) return;
      raise();
    };
    GESTURES.forEach((name) =>
      window.addEventListener(name, onGesture, { passive: true }),
    );

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      GESTURES.forEach((name) => window.removeEventListener(name, onGesture));
      node.removeEventListener("canplay", onReady);
      node.removeEventListener("playing", onPlaying);
      node.removeEventListener("pause", onPause);
      node.removeEventListener("volumechange", onVolume);
      halt();
    };
  }, [raise]);

  useEffect(() => {
    hush(near);
    return () => hush(false);
  }, [near]);

  const toggleSound = useCallback(() => {
    const node = video.current;
    if (!node) return;

    const next = node.muted;
    wanted.current = next;

    if (next) raise();
    else node.muted = true;
  }, [raise]);

  return { frame, video, ready, playing, sound, toggleSound };
}
