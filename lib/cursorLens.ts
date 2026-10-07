// A cabeca da gota e desenhada com raio fixo (LENS / 2) no centro de uma caixa
// fixa de BOX px, e so muda de tamanho por transform. Assim o mapa de refracao
// e gerado uma vez e nunca precisa acompanhar a gota crescendo ou esticando. A
// caixa e bem maior que a cabeca porque a cauda sai dela e precisa caber.
export const LENS = 128;
export const BOX = 512;

// Deslocamento maximo, em px da caixa, na borda da gota. O feDisplacementMap
// le cada canal como (C - 0.5) * scale, entao o scale do filtro e o dobro.
export const BEND = 26;

// Quanto do desvio vale por igual no disco inteiro (lupa suave no meio) e com
// que dureza o resto se concentra na borda. Agua em gota nao entorta o centro,
// entorta a beirada: a pagina ali aparece puxada para dentro e comprimida.
const MAG = 0.22;
const RIM = 4.2;

// A cauda termina numa bolinha em vez de ponta. No estiramento total o centro
// dela fica a TAIL raios da cabeca e o raio dela e TIP do da cabeca, entao a
// ponta de tras chega a 2.8 raios do centro.
const TAIL = 2.5;
const TIP = 0.3;
// Quanto os lados afundam entre a cabeca e a bolinha, em radianos de desvio da
// tangente reta. Zero seria um cone de lados retos; com isto e um pescoco.
const NECK = 0.35;
// Quanto a cabeca alonga na direcao do movimento e afina no outro eixo.
const HEAD = 0.16;

const R = LENS / 2;
const C = BOX / 2;

function bend(r: number) {
  return MAG * r + (1 - MAG) * r ** RIM;
}

// R e G carregam o desvio em x e y, com 128 como repouso. O desvio aponta para
// o centro, que e o que faz a borda mostrar um pedaco da pagina que esta mais
// para dentro. Fora da cabeca o valor para no da borda: a cauda inteira refrata
// como a beirada, e o antialias do recorte nao pega um degrau.
export function lensMap() {
  const canvas = document.createElement("canvas");
  canvas.width = BOX;
  canvas.height = BOX;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const image = ctx.createImageData(BOX, BOX);

  for (let y = 0; y < BOX; y++) {
    for (let x = 0; x < BOX; x++) {
      const nx = (x + 0.5 - C) / R;
      const ny = (y + 0.5 - C) / R;
      const r = Math.hypot(nx, ny);
      const k = r > 0 ? bend(Math.min(r, 1)) / r : 0;
      const at = (y * BOX + x) * 4;

      image.data[at] = Math.round(128 - Math.max(-1, Math.min(1, nx * k)) * 127);
      image.data[at + 1] = Math.round(128 - Math.max(-1, Math.min(1, ny * k)) * 127);
      image.data[at + 2] = 128;
      image.data[at + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

const fix = (n: number) => n.toFixed(2);

// O contorno da gota em coordenadas da caixa, com o movimento apontando para
// `turn` (radianos) e `stretch` indo de 0 (parada, um circulo) a 1 (a toda). A
// mola deixa `stretch` passar de 0 para baixo na parada, e ai a cabeca achata
// no eixo do movimento em vez de alongar: e o balanco.
//
// A bolinha da cauda nasce do tamanho da cabeca, em cima dela, e com o
// estiramento encolhe e recua; por isso a gota sai do circulo sem degrau. Os
// lados partem da tangente comum aos dois circulos e cada emenda desliza NECK
// para um lado: na cabeca desce para tras, na bolinha sobe para frente. A
// cubica entre elas, com os controles sobre a tangente de cada circulo, afunda
// no meio sem quebrar em nenhuma das emendas.
export function dropPath(turn: number, stretch: number) {
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const sx = 1 + HEAD * stretch;
  const sy = 1 - HEAD * 0.5 * stretch;
  const tilt = fix((turn * 180) / Math.PI);

  const at = (u: number, v: number) => {
    const x = u * sx;
    const y = v * sy;
    return `${fix(C + x * cos - y * sin)} ${fix(C + x * sin + y * cos)}`;
  };

  const lobe = `A ${fix(R * sx)} ${fix(R * sy)} ${tilt} 1 0`;
  const pull = Math.max(stretch, 0);
  const back = R * TAIL * pull;

  if (back < 0.5) {
    return `M ${at(R, 0)} ${lobe} ${at(-R, 0)} ${lobe} ${at(R, 0)} Z`;
  }

  const tip = R * (1 - (1 - TIP) * pull);
  const side = Math.acos(-(R - tip) / back);
  const bow = NECK * pull;
  const head = side + bow;
  const tail = side - bow;

  const hu = R * Math.cos(head);
  const hv = R * Math.sin(head);
  const tu = -back + tip * Math.cos(tail);
  const tv = tip * Math.sin(tail);
  const grip = Math.hypot(tu - hu, tv - hv) * 0.36;
  const hcu = hu - grip * Math.sin(head);
  const hcv = hv + grip * Math.cos(head);
  const tcu = tu + grip * Math.sin(tail);
  const tcv = tv - grip * Math.cos(tail);

  const wide = 2 * Math.PI - 2 * tail > Math.PI ? 1 : 0;
  const cap = `A ${fix(tip * sx)} ${fix(tip * sy)} ${tilt} ${wide} 0`;

  return [
    `M ${at(hu, hv)}`,
    `${lobe} ${at(hu, -hv)}`,
    `C ${at(hcu, -hcv)} ${at(tcu, -tcv)} ${at(tu, -tv)}`,
    `${cap} ${at(tu, tv)}`,
    `C ${at(tcu, tcv)} ${at(hcu, hcv)} ${at(hu, hv)}`,
    "Z",
  ].join(" ");
}
