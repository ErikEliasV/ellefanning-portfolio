import { SECTIONS } from "@/data/sections";
import { asset } from "@/lib/asset";

type Link = { saveData?: boolean; effectiveType?: string };

const ready = new Map<string, string>();
let warming = false;

function thrifty() {
  const link = (navigator as Navigator & { connection?: Link }).connection;
  return Boolean(link?.saveData) || /2g/.test(link?.effectiveType ?? "");
}

export function clipSrc(path: string) {
  return ready.get(path) ?? asset(path);
}

export async function warmClips() {
  if (warming || thrifty()) return;
  warming = true;

  for (const section of SECTIONS) {
    try {
      const res = await fetch(asset(section.clip), { priority: "low" });
      if (!res.ok) continue;
      ready.set(section.clip, URL.createObjectURL(await res.blob()));
    } catch {
      return;
    }
  }
}
