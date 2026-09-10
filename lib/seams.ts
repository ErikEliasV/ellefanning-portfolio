"use client";

// The rose field does not simply slide up into the ink any more: the front is a
// turbulent surface, and it throws droplets ahead of itself while it climbs.
export const INK_TIDE = `
uniform float uRise;
uniform float uBurn;
uniform float uBar;
uniform vec3 uWash;
uniform vec3 uInk;

const float SURF = 0.055;
const float DROPS = 0.04;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * (uRes.x / uRes.y), uv.y);

  // Calm at both ends, wildest halfway across the handoff.
  float heat = sin(clamp(uRise, 0.0, 1.0) * 3.14159);

  vec2 warp = vec2(
    fbm(p * 2.4 + vec2(0.0, uTime * 0.09)),
    fbm(p * 2.4 + vec2(4.7, 2.1) - vec2(0.0, uTime * 0.13))
  );
  // Two scales: the slow warped swell decides where the tide bulges, and a
  // fine octave on top keeps it from reading as one soft blob.
  float body = fbm(p * 3.1 + warp * 1.15);
  float fine = fbm(p * 9.4 + vec2(uTime * 0.07, -uTime * 0.12));

  // The canvas sits under the solid panel, so the surface may only reach up,
  // never down: dipping below the panel edge would just expose the straight
  // line this is here to break.
  float front = 1.0 - (1.0 - uBar) * (1.0 - uRise);
  float swell = max(body - 0.5, 0.0) * 0.78 + max(fine - 0.5, 0.0) * 0.36;
  float surface = front + swell * SURF * 2.0 * heat;
  float sheet = smoothstep(surface, surface - 0.012, uv.y) * step(front - 0.004, uv.y);

  // Droplets thrown clear of the surface, thinning out with height.
  float grain = fbm(p * 17.0 + vec2(uTime * 0.31, -uTime * 0.46));
  float above = clamp((uv.y - surface) / DROPS, 0.0, 1.0);
  float spray = smoothstep(0.66, 0.80, grain) * (1.0 - above) * heat;

  float ink = clamp(max(sheet, spray), 0.0, 1.0);
  if (ink < 0.004) discard;

  vec3 color = mix(uWash, uInk, uBurn);
  gl_FragColor = vec4(color, ink);
}
`;

// The ink sheet over the trailer does not wipe away, it gives out: holes open
// where the noise is thinnest and the rest runs off downward.
export const INK_MELT = `
uniform float uOpen;
uniform vec3 uInk;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * (uRes.x / uRes.y), uv.y);

  float body = fbm(p * 2.7 + vec2(0.0, uTime * 0.035));
  float runs = fbm(vec2(p.x * 9.0, p.y * 1.15 - uTime * 0.06));

  // Thin at the bottom and wherever the noise dips, so the sheet tears there
  // first and the last of it clings to the top corners.
  float body_field = body * 0.5 + (1.0 - uv.y) * 0.36 + runs * 0.22;
  float edge = uOpen * 1.45 - 0.2;
  float sheet = smoothstep(edge - 0.16, edge + 0.14, body_field);

  if (sheet < 0.004) discard;
  gl_FragColor = vec4(uInk, sheet);
}
`;
