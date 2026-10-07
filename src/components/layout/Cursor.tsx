"use client";

import { BEND, BOX } from "@/lib/motion/cursorLens";
import { useCursor } from "@/hooks/useCursor";
import "@/styles/cursor.css";

// O centro da cabeca na caixa, e os dois brilhos medidos a partir dele: o
// especular no alto a esquerda e a luz que atravessa a gota e junta embaixo.
const MID = BOX / 2;

export function Cursor() {
  const { shell, lens, body, outline, map, dot, label, fine } = useCursor();

  if (!fine) return null;

  return (
    <div ref={shell} aria-hidden className="cur">
      <span ref={lens} className="cur-lens">
        <span ref={body} className="cur-body" />

        <svg className="cur-skin" width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`}>
          <defs>
            <path ref={outline} id="cur-shape" />
            <clipPath id="cur-inside">
              <use href="#cur-shape" />
            </clipPath>

            <radialGradient id="cur-glint">
              <stop offset="0" className="cur-glint-core" />
              <stop offset="1" className="cur-glint-fade" />
            </radialGradient>

            {/* Em sRGB e nao no linearRGB padrao: o mapa guarda o repouso em
                128, e lido em espaco linear esse meio-termo vira um desvio que
                nao existe. O href do feImage entra pelo hook, gerado uma vez em
                lib/cursorLens.ts. */}
            <filter
              id="cur-lens"
              x="0"
              y="0"
              width={BOX}
              height={BOX}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                ref={map}
                x="0"
                y="0"
                width={BOX}
                height={BOX}
                preserveAspectRatio="none"
                result="map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={BEND * 2}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>

            {/* As duas sombras internas que o box-shadow fazia, agora seguindo a
                cauda. O dilate faz o papel do spread negativo: encolhe o
                buraco, e a luz entra so um fio pela borda. */}
            <filter id="cur-light" x="-20%" y="-20%" width="140%" height="140%">
              <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="lit-grow" />
              <feComponentTransfer in="lit-grow" result="lit-hole">
                <feFuncA type="table" tableValues="1 0" />
              </feComponentTransfer>
              <feOffset in="lit-hole" dx="4" dy="5" result="lit-off" />
              <feGaussianBlur in="lit-off" stdDeviation="3.5" result="lit-blur" />
              <feFlood className="cur-flood-light" result="lit-tone" />
              <feComposite in="lit-tone" in2="lit-blur" operator="in" result="lit" />

              <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="shade-grow" />
              <feComponentTransfer in="shade-grow" result="shade-hole">
                <feFuncA type="table" tableValues="1 0" />
              </feComponentTransfer>
              <feOffset in="shade-hole" dx="-5" dy="-8" result="shade-off" />
              <feGaussianBlur in="shade-off" stdDeviation="6" result="shade-blur" />
              <feFlood className="cur-flood-shade" result="shade-tone" />
              <feComposite in="shade-tone" in2="shade-blur" operator="in" result="shade" />

              <feMerge result="both">
                <feMergeNode in="shade" />
                <feMergeNode in="lit" />
              </feMerge>
              <feComposite in="both" in2="SourceAlpha" operator="in" />
            </filter>

            {/* A sombra na pagina, so por fora: o "out" final tira o pedaco que
                cairia debaixo do vidro. */}
            <filter id="cur-cast" x="-40%" y="-40%" width="180%" height="200%">
              <feMorphology in="SourceAlpha" operator="erode" radius="14" result="core" />
              <feOffset in="core" dy="12" result="low" />
              <feGaussianBlur in="low" stdDeviation="6.5" result="soft" />
              <feFlood className="cur-flood-cast" result="tone" />
              <feComposite in="tone" in2="soft" operator="in" result="cast" />
              <feComposite in="cast" in2="SourceAlpha" operator="out" />
            </filter>
          </defs>

          <use href="#cur-shape" filter="url(#cur-cast)" />
          <use href="#cur-shape" filter="url(#cur-light)" />
          <use href="#cur-shape" className="cur-rim" clipPath="url(#cur-inside)" />

          <g clipPath="url(#cur-inside)">
            <ellipse
              className="cur-glint"
              cx={MID - 19.2}
              cy={MID - 37.8}
              rx="20.5"
              ry="10.9"
              transform={`rotate(-32 ${MID - 19.2} ${MID - 37.8})`}
            />
            <ellipse
              className="cur-glint"
              cx={MID + 19.2}
              cy={MID + 44.2}
              rx="25.6"
              ry="8.3"
              opacity="0.4"
              transform={`rotate(-32 ${MID + 19.2} ${MID + 44.2})`}
            />
          </g>
        </svg>
      </span>

      <span ref={dot} className="cur-dot" />
      <span ref={label} className="cur-label" />
    </div>
  );
}
