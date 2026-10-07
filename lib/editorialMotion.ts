// O movimento do reel do editorial, sem tocar no DOM: a pergunta "a pagina esta
// rolando?" logo abaixo, e a fisica do reel arrastado do telefone no fim.
//
// "A pagina esta rolando?", para o reel do editorial. O hook
// (lib/useEditorialReel.ts) mede o topo da trilha a cada quadro e escreve
// `data-scrolling` quando a resposta muda; e essa marca que impede uma foto de
// crescer no hover enquanto o reel corre por baixo do ponteiro
// (styles/editorial.css).
//
// A pergunta e por VELOCIDADE, com histerese, e nao por "andou desde o ultimo
// quadro". As duas versoes anteriores erravam no mesmo lugar, o rastro do Lenis
// (LERP 0.06 em lib/scroll.ts), que segue andando quase dois segundos depois
// de a roda parar e termina em degraus de um pixel FISICO -- 0,8px de CSS num
// Windows a 125% -- cada vez mais espacados.
//
//   - Comparacao exata: qualquer fracao de pixel contava, e a marca ficava
//     acesa ate o rastro morrer; a foto so crescia quase 2s depois.
//   - Limiar de 0,5px acumulado com timer de 180ms: a marca caia entre dois
//     degraus, a foto comecava a crescer, o degrau seguinte a religava e a foto
//     encolhia, e ela caia de novo e a foto crescia. Lido na tela: expande,
//     diminui, expande. Simulado contra o rastro: a marca voltava uma vez em
//     quase toda combinacao de densidade e taxa de quadro.
//
// Com a velocidade media e dois limiares, acender pede rolagem de verdade
// (START) e manter acesa pede so movimento que se ve (STAY). O rastro desce de
// um para o outro uma vez so e nunca mais sobe: os degraus esparsos do fim
// mal mexem na media.

// Constante de tempo da media da velocidade, em ms. Curta o bastante para um
// tique de roda acender em poucos quadros, longa o bastante para um degrau
// isolado de um pixel nao virar um pico: a 144Hz ele mede 144px/s num quadro
// e entra na media como ~19.
const TAU = 50;
// Em px/s. Um tique de roda (100px) passa disso em ate 50ms; o rastro do Lenis
// so passa enquanto ainda e rolagem de verdade. Um empurrao menor que um tique
// pode nem acender, e tudo bem: o reel anda ~140px ao longo de segundo e meio,
// devagar demais para trocar a foto sob o ponteiro.
const START = 150;
// Abaixo disto o reel anda a menos de ~150px/s na horizontal (ele corre ~2,4x a
// rolagem), devagar demais para a foto sob o ponteiro trocar no meio do hover.
const STAY = 60;
// Quanto tempo abaixo de STAY antes de apagar, em ms. O valor que o hook ja
// usava.
const IDLE = 180;

export type Motion = {
  moving: boolean;
  /** Velocidade media do topo da trilha, em px/s. */
  speed: number;
  top: number;
  at: number;
  /** Ultimo instante com a velocidade acima de STAY. */
  calm: number;
};

// Le o topo da trilha em `top` (px) no instante `now` (ms) e devolve o estado
// seguinte. `null` e o primeiro quadro: ainda nao ha de onde medir.
export function sense(m: Motion | null, top: number, now: number): Motion {
  if (!m) return { moving: false, speed: 0, top, at: now, calm: now };

  const dt = now - m.at;
  // A medicao e o tique podem ler no mesmo instante; sem tempo nao ha
  // velocidade, e dividir por zero daria infinito.
  if (dt <= 0) return m;

  const v = (Math.abs(top - m.top) / dt) * 1000;
  // Decaimento por tempo, nao por quadro: a 144Hz um fator por quadro mediria
  // outra coisa que a 60Hz.
  const speed = m.speed + (v - m.speed) * (1 - Math.exp(-dt / TAU));
  const calm = speed > STAY ? now : m.calm;
  const moving = m.moving ? now - calm <= IDLE : speed > START;

  return { moving, speed, top, at: now, calm };
}

// ---------------------------------------------------------------------------
// O reel arrastado do telefone.
//
// No telefone a rolagem vertical deixou de passar as fotos, a pedido do dono
// do projeto, como ja tinha deixado no deck de Characters: o reel anda com o
// dedo de lado. O hook converte o arrasto em `pan` (px de reel, 0 na primeira
// foto e `panMax` na ultima) e desenha por `reelRubber`; na soltura,
// `reelRelease` escolhe a parada e o gsap assenta nela.
// ---------------------------------------------------------------------------

// As posicoes de descanso do reel, em px de `pan`: cada foto centralizada na
// tela, com um pedaco da vizinha aparecendo de cada lado. A primeira e a
// ultima nao tem como centralizar -- nao ha reel antes nem depois --, entao
// encostam na borda.
export function reelStops(
  count: number,
  cell: number,
  view: number,
  panMax: number,
) {
  const stops: number[] = [];
  for (let k = 0; k < count; k += 1) {
    const at = Math.min(Math.max(k * cell - (view - cell) / 2, 0), panMax);
    if (!stops.length || at > stops[stops.length - 1] + 0.5) stops.push(at);
  }
  return stops;
}

// Quanto o elastico cede no comeco do puxao. O teto vem de fora, em px, porque
// depende do tamanho da tela.
const RUBBER_GIVE = 0.55;

// O `pan` desenhado para um `pan` cru. Dentro do percurso e a identidade; fora,
// a curva do elastico do iOS -- cede RUBBER_GIVE no comeco e nunca passa de
// `reach` px, por mais que o dedo va.
export function reelRubber(raw: number, panMax: number, reach: number) {
  const base = Math.min(Math.max(raw, 0), panMax);
  const over = raw - base;
  if (over === 0) return raw;
  if (reach <= 0) return base;
  const pull = Math.abs(over);
  const give = reach * (1 - 1 / ((pull * RUBBER_GIVE) / reach + 1));
  return base + Math.sign(over) * give;
}

// Quanto de impulso a soltura projeta, em segundos de velocidade, e a partir de
// que velocidade (px/s) o gesto conta como um peteleco que anda ao menos uma
// foto mesmo sem ter passado da metade do caminho.
const FLING = 0.12;
const FLICK = 300;

function nearest(stops: number[], at: number) {
  let best = 0;
  for (let i = 1; i < stops.length; i += 1) {
    if (Math.abs(stops[i] - at) < Math.abs(stops[best] - at)) best = i;
  }
  return best;
}

// Em que parada o reel assenta quando o dedo solta em `raw` com `velocity`
// px/s de `pan` (positivo e para a frente, o dedo indo para a esquerda).
export function reelRelease(raw: number, velocity: number, stops: number[]) {
  const here = nearest(stops, raw);
  let target = nearest(stops, raw + velocity * FLING);
  if (target === here && Math.abs(velocity) > FLICK) {
    target = Math.min(Math.max(here + Math.sign(velocity), 0), stops.length - 1);
  }
  return stops[target];
}
