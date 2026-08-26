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
app/         paginas e rotas
components/  componentes reutilizaveis
sections/    secoes do site
lib/         funcoes e utilitarios
public/      imagens, videos e estaticos
styles/      estilos globais e tokens de design
```

## Design system

A identidade visual segue o design system brutalista editorial da marca: paper
`#F6F3E9`, ink `#131313` e um unico acento amarelo `#FFCC00`. Display em Anton,
texto de trabalho em Space Mono, prosa longa em Archivo. Sem border-radius, sem
sombras difusas — apenas hard offsets — e imagens sempre em grayscale de alto
contraste.

Os tokens vivem em `styles/globals.css` sob `@theme`. A pasta de referencia
`ellefaning_desingsystem/` e local e nao versionada.

## Secoes

| # | Secao | Rota / ancora |
| --- | --- | --- |
| 01 | Apresentacao | `#hero` |
| 02 | Filmografia | `#filmography` |
| 03 | Personagens | `#characters` |
| 04 | Carreira | `#timeline` |
| 05 | Editorial | `#editorial` |
| 06 | Bastidores | `#behind-the-scenes` |
| 07 | Projetos atuais | `#current` |
| 08 | Final | `#footer` |

## Git Flow

`main` estavel · `develop` integracao · `feature/*` uma por etapa.
