export function markOutsideInert(node: HTMLElement): HTMLElement[] {
  const marked: HTMLElement[] = [];
  let child: Element = node;
  while (child !== document.body && child.parentElement) {
    const parent = child.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === child) continue;
      const el = sibling as HTMLElement;
      el.setAttribute("inert", "");
      marked.push(el);
    }
    child = parent;
  }
  return marked;
}

export function clearInert(elements: readonly HTMLElement[]) {
  for (const el of elements) el.removeAttribute("inert");
}
