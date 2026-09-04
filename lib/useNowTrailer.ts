"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_SRC = "https://www.youtube.com/iframe_api";
const ENDED = 0;
const SYNC = 500;
const GESTURES = ["pointerdown", "keydown", "touchstart"] as const;

type Player = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (level: number) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type PlayerEvent = { target: Player; data: number };

type PlayerOptions = {
  events: {
    onReady: (event: PlayerEvent) => void;
    onStateChange: (event: PlayerEvent) => void;
  };
};

type YouTubeApi = {
  Player: new (host: HTMLIFrameElement, options: PlayerOptions) => Player;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let bridge: Promise<YouTubeApi> | null = null;

function loadApi() {
  if (bridge) return bridge;

  bridge = new Promise<YouTubeApi>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const earlier = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      earlier?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube API arrived without a player"));
    };

    const found = document.querySelector<HTMLScriptElement>(
      `script[src="${API_SRC}"]`,
    );
    const tag = found ?? document.createElement("script");

    tag.addEventListener("error", () => reject(new Error("YouTube API blocked")));

    if (!found) {
      tag.src = API_SRC;
      tag.async = true;
      document.head.append(tag);
    }
  });

  return bridge;
}

export function useNowTrailer() {
  const frame = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLIFrameElement>(null);
  const built = useRef<Player | null>(null);
  const player = useRef<Player | null>(null);
  const onScreen = useRef(false);
  const wanted = useRef(true);
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);

  const raise = useCallback(() => {
    const node = player.current;
    if (!node) return;
    node.unMute();
    node.setVolume(100);
  }, []);

  useEffect(() => {
    const host = frame.current;
    const node = stage.current;
    if (!host || !node) return;

    let alive = true;

    const play = () => {
      const live = player.current;
      if (!live || !onScreen.current || document.hidden) return;
      if (wanted.current) raise();
      live.playVideo();
    };
    const halt = () => player.current?.pauseVideo();

    const wake = (api: YouTubeApi) => {
      if (!alive) return;

      if (built.current) {
        if (!player.current) return;
        setReady(true);
        play();
        return;
      }

      built.current = new api.Player(node, {
        events: {
          onReady: (event) => {
            player.current = event.target;
            setReady(true);
            play();
          },
          onStateChange: (event) => {
            if (event.data !== ENDED) return;
            event.target.seekTo(0, true);
            event.target.playVideo();
          },
        },
      });
    };

    loadApi()
      .then(wake)
      .catch(() => {});

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
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

    const mirror = window.setInterval(() => {
      const live = player.current;
      if (live) setSound(!live.isMuted());
    }, SYNC);

    return () => {
      alive = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      GESTURES.forEach((name) => window.removeEventListener(name, onGesture));
      window.clearInterval(mirror);
      halt();
    };
  }, [raise]);

  const toggleSound = useCallback(() => {
    const node = player.current;
    if (!node) return;

    const next = !sound;
    wanted.current = next;

    if (next) raise();
    else node.mute();

    setSound(next);
  }, [raise, sound]);

  return { frame, stage, ready, sound, toggleSound };
}
