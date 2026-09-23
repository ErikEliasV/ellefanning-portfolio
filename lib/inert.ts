// O modal nao e portalado para <body>: ele mora dentro do palco da secao,
// varios niveis abaixo do header e do botao de som. "Marcar os irmaos" nao
// basta, porque em cada nivel intermediario ha um conjunto diferente de irmaos
// para inertizar. Esta funcao sobe da caixa do modal ate <body>, e em cada
// parada marca todo mundo que nao e o proprio caminho ate o modal -- inclusive
// o palco atras do fundo escurecido, o header e o botao de som, que vivem em
// `<body>`.
//
// Devolve a lista do que foi marcado, e e essa lista -- nao um novo passeio
// pela arvore -- que o cleanup usa para desmarcar. Motivo: no desmonte, o React
// ja removeu `node` do documento antes de rodar a limpeza do efeito, e
// `node.parentElement` de um no destacado e `null` -- um novo passeio a partir
// dele nao encontra mais nada para desmarcar, e o `inert` fica esquecido para
// sempre no header, no som e no palco.
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
