"use client";

import { useEffect, useRef, useState } from "react";
import { CURTAIN_OUT, NARROW_QUERY, cursor, depth, geometry, trackVh } from "@/lib/filmStage";
import { isReduced, onTick } from "@/lib/scroll";
import { reelTick } from "@/lib/audio";

// Espelha `smallViewportHeight()` de `lib/useHeroMorph.ts` e
// `lib/useEditorialReel.ts` (não está exportada de nenhum dos dois). Sonda
// `100svh` com um elemento fora de tela e cai para `innerHeight` se o
// navegador não suportar — é o padrão que o resto do site usa para não
// pular quando a barra de URL do celular recolhe/expande.
function smallViewportHeight() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height || window.innerHeight;
}

export function useFilmStage(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const cut = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState(0);
  const [lock, setLock] = useState(0);

  const lastLock = useRef(0);
  // `lastLock` guarda o último valor de c.lock, inclusive -1, e é o que evita
  // redisparo por frame. A direção do tranco precisa de outra coisa: o último
  // índice de fato travado. Em scroll contínuo o cursor passa por -1 entre uma
  // trava e a seguinte, então usar `lastLock` para a direção comparava sempre
  // contra -1 e o tranco nunca invertia.
  const lastIndex = useRef(-1);
  // `lock === -1` acontece em dois momentos bem diferentes: durante a intro
  // (antes do reel começar, `p < f.reel.from`) e em trânsito entre duas travas
  // do meio do reel. `active` (estado do React) segura o último valor até o
  // próximo `setActive`, e como esse setState só dispara na troca de `c.lock`,
  // subir a página de volta para a intro nunca zera o contador — ele fica
  // mostrando o último filme travado antes da intro. `lastIntro` marca só a
  // BORDA de entrada na intro (null no primeiro paint, depois true/false), pelo
  // mesmo motivo de `lastLock`: comparar contra o quadro anterior, não contra
  // `p` de novo, para não disparar `setActive` a cada frame enquanto a intro
  // continua.
  const lastIntro = useRef<boolean | null>(null);
  // Só existe um kick em voo por vez — o estalo dispara na troca de trava, e a
  // troca é única — então um ref basta para guardar o timer pendente. Sem ele,
  // se o mesmo card travasse de novo antes dos 120ms, o timeout velho apagaria
  // o atributo que pertence à trava nova, cortando a animação no meio.
  const kickTimer = useRef(0);
  // O card dono do timer pendente. Quando uma trava nova cancela o timeout de
  // uma trava anterior EM OUTRO card, ninguém mais vai limpar o data-kick
  // daquele card — ele fica cravado para sempre e o card fica mudo naquela
  // direção pelo resto da sessão. Este ref é o que permite apagar o atributo
  // do card anterior antes de trocar de timer.
  const kickCard = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let vh = 0;
    let pitch = 0;
    let cardW = 0;
    let cardH = 0;
    let splitMax = 0;

    function paint() {
      const trackEl = track.current;
      const stageEl = stage.current;
      const railEl = rail.current;
      if (!trackEl || !stageEl || !railEl || vh === 0) return;

      const reduced = isReduced();
      const p = -trackEl.getBoundingClientRect().top / vh;
      const c = cursor(p, reduced);

      const set = (name: string, value: string) =>
        trackEl.style.setProperty(name, value);

      const splitPx = c.split * splitMax;

      set("--curtain", c.curtain.toFixed(4));
      set("--rise", c.rise.toFixed(4));
      set("--split", `${splitPx.toFixed(2)}px`);
      set("--fall", c.fall.toFixed(4));
      set("--reveal", c.reveal.toFixed(4));

      // A cortina serve só à entrada, cobrindo a hero enquanto o palco não chegou. Um
      // instante depois disso ela precisa sair do caminho, senão o z-index 60 dela
      // fica acima do contexto isolado do palco e apaga a seção inteira.
      //
      // CURTAIN_OUT (0.05) não tem 0.4vh de colchão, mesmo `--curtain` saturando em
      // p = -0.35: entre -0.35 e 0 quem cobre a tela ainda é só a cortina, porque o
      // palco sticky só trava no topo — e passa a cobrir o viewport inteiro — em
      // p = 0. A folga real, entre "o palco já cobre" e "a cortina sai", é de 0.05vh
      // contados a partir de p = 0, não de -0.35. Mexer no limiar, na posição do
      // palco dentro de .film-track ou nas fases precisa contar a partir daí, senão
      // volta o bug que esta tarefa corrigiu. E isso vale em qualquer modo: p = 0 é
      // geométrico (`-trackTop / vh`), phases() não muda onde o palco gruda.
      // `rise` em filmStage.ts parte deste mesmo CURTAIN_OUT — os dois lados
      // têm que concordar sobre o instante em que a cortina solta a cena.
      const curtainEl = curtain.current;
      if (curtainEl) {
        if (p < CURTAIN_OUT) curtainEl.dataset.on = "";
        else delete curtainEl.dataset.on;
      }

      for (let i = 0; i < count; i += 1) {
        const card = railEl.children[i] as HTMLElement | undefined;
        if (!card) continue;

        const d = depth(i, c.u);
        // Enquanto o 1º pôster ainda está subindo pelo vão (c.enter < 1), os
        // vizinhos não podem aparecer: `depth(1, 0).live` já é `true` a um
        // passo de distância, mas o primeiro filme ainda nem entrou em quadro.
        // Card 0 continua sendo desenhado — é ele que sobe. `c.enter` é
        // função pura de `p`, então isto desfaz sozinho subindo a página: os
        // vizinhos voltam a sumir sem lógica extra de direção.
        if (!d.live || (i > 0 && c.enter < 1)) {
          card.style.visibility = "hidden";
          continue;
        }

        // O primeiro pôster sobe pelo vão que a palavra acabou de abrir. São
        // 120% da própria altura, não 100%: o card é centrado na tela, então
        // empurrá-lo só uma altura deixaria o topo dele aparecendo na borda de
        // baixo antes da hora.
        const lift = i === 0 ? (1 - c.enter) * 120 : 0;

        card.style.visibility = "visible";
        card.style.transform =
          `translate3d(${(d.offset * pitch).toFixed(2)}px, ${lift.toFixed(2)}%, 0)` +
          ` scale(${d.scale.toFixed(4)})`;
        card.style.filter = reduced || d.blur < 0.1 ? "" : `blur(${d.blur.toFixed(2)}px)`;
      }

      // FILMO branca só aparece onde há pôster atrás dela. O recorte segue a caixa do
      // card mais próximo — ao passo de 48vw nunca há dois sobre a palavra ao mesmo
      // tempo, então "o mais próximo" é exato, não aproximação. L/R saem da matemática
      // (centro ± largura × escala / 2), nunca de nova leitura de layout por card.
      //
      // Duas getBoundingClientRect por frame são necessárias, não uma. A primeira
      // (`box`, de `cutEl`) é a fonte do centro do palco (veja abaixo por quê —
      // window.innerWidth não serve) e, de graça, da extensão VERTICAL da palavra
      // (box.top/box.bottom). Restaurar a matemática pura para essa leitura
      // reintroduziria o deslocamento de 7,5px que ela corrige; não trocar por
      // cálculo sem reconferir aquilo.
      //
      // A segunda (`stageBox`, de `stageEl`) é nova: o recorte antes só comparava
      // sobreposição HORIZONTAL (cx ± half contra box.left/box.right) e nunca olhava
      // a vertical. Durante a intro o card 0 está a 120% de distância vertical (fora
      // da tela, ver `lift` acima), mas o centro horizontal dele já coincide com a
      // borda de FILMO (--split é 0 aí, as duas metades encostadas no centro) — o
      // recorte concluía que havia sobreposição e pintava as letras de branco em
      // repouso. A extensão vertical do card não pode vir de uma constante do CSS
      // como `40.8vh`: duplicar essa medida entre CSS e JS já causou a regressão dos
      // 7,5px citada acima, e o plano proíbe repetir isso — ler o rect do palco é
      // como saber onde o card cai sem duplicar nada.
      const cutEl = cut.current;
      if (cutEl) {
        const box = cutEl.getBoundingClientRect();
        const stageBox = stageEl.getBoundingClientRect();
        // window.innerWidth inclui a calha da barra de rolagem
        // (scrollbar-gutter: stable), então não é o centro real do palco. A
        // borda direita da própria caixa já é `centroDoPalco - split` (é como
        // .film-word-cut é posicionada em CSS: `right: calc(50% + var(--split))`),
        // então o centro sai dela mesma, sem nova leitura de layout.
        const mid = box.right + splitPx;

        let near = 0;
        let best = Infinity;
        for (let i = 0; i < count; i += 1) {
          const gap = Math.abs(i - c.u);
          if (gap < best) { best = gap; near = i; }
        }

        const d = depth(near, c.u);
        const half = (cardW * d.scale) / 2;
        const cx = mid + d.offset * pitch;

        // Centro vertical do card: o do palco (posição de repouso — o card é
        // `top: 50%` dentro de .film-rail, que preenche o palco) mais o
        // deslocamento do `lift`, só relevante para o card 0. Percentual de
        // `translate3d` resolve contra a altura do próprio elemento (`cardH`
        // sem escala), então o deslocamento em px é `lift% × cardH` — igual
        // ao que o CSS aplica no card de verdade.
        const liftNear = near === 0 ? (1 - c.enter) * 120 : 0;
        const halfH = (cardH * d.scale) / 2;
        const cy = stageBox.top + stageBox.height / 2 + (liftNear / 100) * cardH;
        const overlapsVertically = cy + halfH > box.top && cy - halfH < box.bottom;

        const l = overlapsVertically
          ? Math.min(Math.max(cx - half - box.left, 0), box.width)
          : box.width;
        const r = overlapsVertically
          ? Math.min(Math.max(box.right - (cx + half), 0), box.width)
          : 0;

        set("--cut-l", `${l.toFixed(2)}px`);
        set("--cut-r", `${r.toFixed(2)}px`);
      }

      if (c.lock !== lastLock.current) {
        // O único beat que não é posição. Fora da matemática de scroll de propósito: se
        // o overshoot fosse scrubbado, rolar devagar o esticaria por segundos e ele
        // deixaria de ser seco — e o som, de duração fixa, dessincronizaria.
        if (c.lock >= 0) {
          reelTick(c.lock, c.lock / (count - 1));
          const card = rail.current?.children[c.lock] as HTMLElement | undefined;
          if (card && !isReduced()) {
            // Na primeira trava da seção não há índice anterior: lastIndex
            // ainda é -1, e não existe "direção" para trás disso.
            const back = lastIndex.current >= 0 && c.lock < lastIndex.current;
            card.dataset.kick = back ? "-" : "+";
            const prev = kickCard.current;
            if (prev && prev !== card) delete prev.dataset.kick;
            window.clearTimeout(kickTimer.current);
            kickCard.current = card;
            kickTimer.current = window.setTimeout(() => {
              delete card.dataset.kick;
              kickCard.current = null;
            }, 120);
          }
          lastIndex.current = c.lock;
        }

        lastLock.current = c.lock;
        setLock(c.lock);
        // O contador e o ano trocam em corte duro, no instante da trava, e
        // seguram o último valor enquanto o próximo está em trânsito.
        if (c.lock >= 0) setActive(c.lock);
      }

      // `cursor()` só atribui `u = 0` por literal (não por cálculo) num único
      // lugar: o ramo `p < f.reel.from`, a intro antes do primeiro filme
      // travar. É o mesmo sinal que identifica "estamos na intro" sem
      // precisar importar `phases()` só para comparar `p` contra
      // `f.reel.from` de novo. (`u` também passa por exatamente 0 num
      // instante do trânsito entre o 1º e o 2º filme — `easeOut4(0)` é 0 por
      // construção — mas ali `active` já vale 0, herdado da trava que acabou
      // de soltar, então forçar 0 de novo é inofensivo.)
      const introNow = c.u === 0 && c.lock === -1;
      if (introNow !== lastIntro.current) {
        lastIntro.current = introNow;
        if (introNow) setActive(0);
      }
    }

    const narrow = window.matchMedia(NARROW_QUERY);

    function measure() {
      const trackEl = track.current;
      if (!trackEl) return;

      const vw = window.innerWidth;
      const g = geometry(narrow.matches);

      vh = smallViewportHeight();
      pitch = g.pitchVw * vw;
      cardW = g.widthVw * vw;
      cardH = cardW * g.ratio;
      splitMax = g.splitVw * vw;

      trackEl.style.setProperty("--card-w", `${cardW.toFixed(2)}px`);
      trackEl.style.setProperty("--card-h", `${cardH.toFixed(2)}px`);
      trackEl.style.height = `${vh * trackVh(isReduced())}px`;
      paint();
    }

    measure();
    const untick = onTick(paint);
    window.addEventListener("resize", measure);
    narrow.addEventListener("change", measure);

    return () => {
      untick();
      window.removeEventListener("resize", measure);
      narrow.removeEventListener("change", measure);
      window.clearTimeout(kickTimer.current);
      if (kickCard.current) delete kickCard.current.dataset.kick;
    };
  }, [count]);

  return { track, stage, rail, cut, curtain, active, lock };
}
