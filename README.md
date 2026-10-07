# Elle Fanning — Portfolio

Portfólio editorial dedicado à atriz e produtora Elle Fanning.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4

## Rodando

```bash
npm install
npm run dev
```

## Estrutura

```
public/                 imagens, videos, audio e icones servidos como estaticos
src/
  app/                  layout, pagina, icones e fontes locais
  sections/             uma secao do site por arquivo
  components/
    characters/         palco e modal da secao Characters
    filmography/        palco e modal da Filmografia
    footer/             pecas do rodape
    layout/             chrome global montado no layout (cursor, preloader, scrollbar, som)
    ui/                 pecas pequenas compartilhadas
  hooks/                hooks React, um por mecanismo
  data/                 conteudo do site (filmes, personagens, editorial, links, secoes)
  lib/                  utilitarios compartilhados (scroll, audio, reveal, swipe, viewport)
    motion/             matematica pura das animacoes de cada peca
    webgl/              cenas three.js
  styles/               css global e um arquivo por secao
```

## Design system

A identidade visual segue o design system brutalista editorial da marca: paper
`#F6F3E9`, ink `#131313` e um unico acento amarelo `#FFCC00`. Display em Anton,
texto de trabalho em Space Mono, prosa longa em Archivo. Sem border-radius, sem
sombras difusas — apenas hard offsets — e imagens sempre em grayscale de alto
contraste.

Os tokens vivem em `src/styles/globals.css` sob `@theme`. A pasta de referencia
`ellefaning_desingsystem/` e local e nao versionada.

## Secoes

| # | Secao | Rota / ancora |
| --- | --- | --- |
| 01 | Apresentacao | `#hero` |
| 02 | Filmografia | `#filmography` |
| 03 | Personagens | `#characters` |
| 04 | Editorial | `#editorial` |
| 05 | Projetos atuais | `#current` |
| 06 | Final | `#footer` |

## Git Flow

`main` estavel · `develop` integracao · `feature/*` uma por etapa.
