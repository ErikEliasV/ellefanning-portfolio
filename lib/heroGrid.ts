// A grade do mosaico da hero, compartilhada pelos dois renderizadores: o plano
// (lib/useHeroField.ts, que aparece primeiro e e o caminho de reserva) e o de
// cubos (lib/heroCloud.ts, que assume no cross-fade). Os dois tem de concordar
// sobre quantas colunas o quadriculado tem, senao a troca entre eles vira um
// salto de textura.
//
// Fica num modulo proprio porque lib/heroCloud.ts importa o three inteiro, e o
// hook do campo plano nao pode arrastar isso junto so para ler duas constantes.

// A calibracao do desenho: 67 colunas em repouso, 40 quando a rolagem
// engrossa o mosaico. Em 1920 de largura isso da uma celula de 28,7px -- um
// quadriculado que se ve, que e o ponto.
export const BLOCKS_A = 67;
export const BLOCKS_B = 40;

// Abaixo daqui a contagem de colunas passa a sair da tela em vez de ser fixa.
// 1023 e o limiar de 64rem que o resto do projeto ja usa (NARROW_QUERY em
// lib/filmStage.ts, as media queries de characters/footer/header).
const NARROW_MAX = 1023;

// Quantas colunas cabem no MENOR lado da tela. 34 devolve uma celula de ~11px
// num telefone de 390 de largura.
//
// Por que o menor lado e nao a largura: com as 67 colunas fixas, um telefone
// em retrato recebia celulas de 5,8px -- cinco vezes menores que as do
// desktop. Aquilo deixa de ler como mosaico e vira tela de mosquiteiro, e
// custa caro: as linhas saem de `altura / celula`, entao celula pequena numa
// tela alta multiplica os cubos. Medido em 390x844: 14.256 cubos contra 4.131
// num 1440x900. Saindo do menor lado, o quadriculado guarda o mesmo peso
// visual em retrato e em paisagem, e a conta cai para ~3.600.
const NARROW_CELLS = 34;

// Piso, para uma janela absurdamente estreita nao virar quatro quadrados.
const MIN_COLS = 12;

// A troca e um degrau no limiar, nao uma curva continua, e de proposito:
// qualquer formula continua que devolvesse 34 colunas em 390px devolveria algo
// diferente de 67 em 1920px, e a regra desta tarefa e que o desktop fique
// identico ao que era. O degrau so e atravessado arrastando a janela por cima
// de 1024px, que nao e um gesto que se faca olhando o mosaico.
export function gridCols(width: number, height: number) {
  if (width > NARROW_MAX) return BLOCKS_A;
  const cell = Math.min(width, height) / NARROW_CELLS;
  if (!cell) return BLOCKS_A;
  return Math.max(Math.round(width / cell), MIN_COLS);
}

// O outro extremo, o mosaico engrossado do fim da rolagem, na mesma razao do
// desenho (40/67) para o movimento de engrossar ter sempre a mesma amplitude.
export function coarseCols(cols: number) {
  return Math.max((cols * BLOCKS_B) / BLOCKS_A, 1);
}
