// Genera src/components/site/world-map.ts: le terre emerse come mappa di bit a mezzo grado
// (720 × 360 celle), ricavata dai contorni Natural Earth 1:50m del pacchetto world-atlas.
// Il globo della home legge questa mappa invece di forme approssimate a mano.
//
//   node scripts/generate-world-map.mjs
//
// Riempimento per righe (pari-dispari) in coordinate lon/lat: molto più veloce di un test
// sferico punto per punto. Gli anelli che attraversano il meridiano 180° vengono "srotolati";
// quelli che girano tutto il globo (Antartide) vengono chiusi passando per il polo.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

const STEP = 0.5;
const W = 360 / STEP;
const H = 180 / STEP;

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-50m.json", import.meta.url), "utf8"));
const land = feature(topo, topo.objects.land);
const geometries = (land.features ?? [land]).map((f) => f.geometry);
const polygons = geometries.flatMap((g) => (g.type === "MultiPolygon" ? g.coordinates : [g.coordinates]));

// Anelli con longitudini continue (senza salti di 360°)
const rings = [];
for (const poly of polygons) {
  for (const ring of poly) {
    const out = [];
    let shift = 0;
    let prev = null;
    for (const [lon, lat] of ring) {
      if (prev !== null) {
        const d = lon + shift - prev;
        if (d > 180) shift -= 360;
        else if (d < -180) shift += 360;
      }
      prev = lon + shift;
      out.push([prev, lat]);
    }
    const drift = out[out.length - 1][0] - out[0][0];
    if (Math.abs(drift) > 180) {
      // L'anello fa il giro del mondo: si chiude lungo il polo più vicino
      const pole = out.reduce((s, p) => s + p[1], 0) / out.length < 0 ? -90 : 90;
      out.push([out[out.length - 1][0], pole], [out[0][0], pole]);
    }
    rings.push(out);
  }
}

const bits = new Uint8Array(Math.ceil((W * H) / 8));
let count = 0;
const set = (r, c) => {
  c = ((c % W) + W) % W;
  const i = r * W + c;
  if (!(bits[i >> 3] & (1 << (i & 7)))) {
    bits[i >> 3] |= 1 << (i & 7);
    count++;
  }
};

// Riga 0 = 90° N, colonna 0 = 180° O; si prova il centro di ogni cella
for (let r = 0; r < H; r++) {
  const lat = 90 - (r + 0.5) * STEP;
  // Incroci per anello, poi riempimento pari-dispari su tutti gli incroci della riga
  const xs = [];
  for (const ring of rings) {
    for (let k = 0; k < ring.length; k++) {
      const [x1, y1] = ring[k];
      const [x2, y2] = ring[(k + 1) % ring.length];
      if (y1 > lat !== y2 > lat) xs.push(x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    const c0 = Math.ceil((xs[k] + 180) / STEP - 0.5);
    const c1 = Math.floor((xs[k + 1] + 180) / STEP - 0.5);
    for (let c = c0; c <= c1; c++) set(r, c);
  }
}

const out = `// File generato da scripts/generate-world-map.mjs: non modificare a mano.
// Terre emerse (Natural Earth 1:50m, pubblico dominio) a mezzo grado: ${W} × ${H} celle, ${count} di terra.

const W = ${W};
const H = ${H};
const STEP = ${STEP};
const DATA = "${Buffer.from(bits).toString("base64")}";

let bits: Uint8Array | null = null;

/** true se il punto (gradi) cade su terra emersa. */
export function isLandAt(lat: number, lon: number): boolean {
  if (!bits) bits = Uint8Array.from(atob(DATA), (c) => c.charCodeAt(0));
  const r = Math.min(H - 1, Math.max(0, Math.floor((90 - lat) / STEP)));
  const c = ((Math.floor((lon + 180) / STEP) % W) + W) % W;
  const i = r * W + c;
  return (bits[i >> 3] & (1 << (i & 7))) !== 0;
}
`;
writeFileSync(new URL("../src/components/site/world-map.ts", import.meta.url), out);
console.log(`world-map.ts: ${W}×${H}, ${count} celle di terra (${((count / (W * H)) * 100).toFixed(1)}%), ${out.length} byte`);
