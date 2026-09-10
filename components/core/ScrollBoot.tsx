"use client";

import { useEffect } from "react";
import { bootScroll } from "@/lib/scroll";

export function ScrollBoot() {
  useEffect(() => bootScroll(), []);
  return null;
}
