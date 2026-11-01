"use client";

import { useEffect, useRef } from "react";
import { isLandAt } from "./world-map";

/**
 * Globo di caratteri ASCII sullo sfondo della pagina (bianco, o scuro con il tema scuro),
 * vista fissa sull'Europa. Terre emerse reali (mappa di bit in world-map.ts, da Natural Earth);
 * l'Europa è ingrandita del 20% ed evidenziata.
 * - fondo: cifre 0/1 sparse e tenui
 * - globo: caratteri densi verde chiaro sulle terre illuminate, che sfumano in verde acqua
 *   e azzurro verso il basso; mare con caratteri radi
 * - anello inclinato con una scritta che orbita intorno alla terra (testo passato da fuori):
 *   la metà dietro è tenue e nascosta dal globo, quella davanti è in primo piano
 * Solo la scritta si muove: globo e sfondo sono disegnati una volta in un'immagine fuori schermo.
 * L'orbita si ferma quando il globo non è visibile e con la riduzione del movimento attiva.
 */

const COLS = 84;
const ROWS = 56;
const LAND_LIT = "B8&@$#%";
const LAND_SHADE = "x+*=%#o";
const SEA = ".·:'.·,";

const DEG = Math.PI / 180;
const PHI_0 = 44 * DEG;
const LAMBDA_0 = 14 * DEG;
const COS_PHI = Math.cos(PHI_0);
const SIN_PHI = Math.sin(PHI_0);

// Colori per tema: su bianco toni più scuri, su fondo scuro toni chiari
const PALETTES = {
  light: {
    digits: "#e2e2e2",
    green: [37, 115, 69] as const,
    teal: [47, 120, 160] as const,
    europe: "#17603a",
    ring: "#3341b8",
    ringBack: "#c3c8ee",
  },
  dark: {
    digits: "#1e2b29",
    green: [166, 227, 176] as const,
    teal: [111, 168, 196] as const,
    europe: "#c4f5cc",
    ring: "#aab6ff",
    ringBack: "#3d4c8a",
  },
};

// Europa ingrandita: si legge la mappa "rimpicciolita" attorno al centro dell'Europa,
// così sul globo il continente appare più grande del 20%
const EUROPE_CENTER = [52, 14] as const;
const EUROPE_SCALE = 1.2;

function isEurope(lat: number, lon: number) {
  if (!isLandAt(lat, lon) || lat < 34.5 || lon < -25 || lon > 40) return false;
  // Fuori: costa nordafricana (ma non il sud della Spagna), Anatolia (ma Cipro sì), Groenlandia
  if (lat < 37.4 && lon >= -18 && lon < 11.8 && !(lon < -1.5 && lat >= 36)) return false;
  if (lon > 26.2 && lat < 41.3 && !(lat > 34.5 && lat < 35.8 && lon > 32 && lon < 34.6)) return false;
  if (lon < -10 && lat > 67) return false;
  return true;
}

function isEuropeScaled(lat: number, lon: number) {
  const [clat, clon] = EUROPE_CENTER;
  return isEurope(clat + (lat - clat) / EUROPE_SCALE, clon + (lon - clon) / EUROPE_SCALE);
}

// Numero pseudo-casuale stabile in [0, 1): stesso disegno a ogni caricamento
function hash(i: number, j: number, k = 0) {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const mix = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(",")})`;

type RingChar = { x: number; y: number; angle: number; front: boolean; char: string };

export function AsciiGlobe({ className, label, ring }: { className?: string; label: string; ring: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    if (!lctx) return;

    // Stato calcolato a ogni ridimensionamento o cambio di tema
    let W = 0;
    let H = 0;
    let dpr = 1;
    let cx = 0;
    let cy = 0;
    let R = 0;
    let ringFont = 0;
    let step = 0;
    let bg = "#ffffff";
    let PALETTE: (typeof PALETTES)[keyof typeof PALETTES] = PALETTES.light;
    // Ellisse dell'orbita campionata per lunghezza d'arco: posizione → parametro t
    const SAMPLES = 1440;
    let arc: number[] = [];
    let perim = 0;
    const tilt = -11 * DEG;
    let ra = 0;
    let rb = 0;

    const ringPoint = (t: number) => {
      const ex = ra * Math.cos(t);
      const ey = rb * Math.sin(t);
      return {
        x: cx + ex * Math.cos(tilt) - ey * Math.sin(tilt),
        y: cy + ex * Math.sin(tilt) + ey * Math.cos(tilt),
        front: Math.sin(t) > 0, // metà inferiore dell'ellisse: davanti al globo
      };
    };

    // Da una distanza lungo l'orbita al parametro t (il testo procede da sinistra a destra davanti)
    const paramAt = (s: number) => {
      const target = ((s % perim) + perim) % perim;
      let lo = 0;
      let hi = SAMPLES;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arc[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      return Math.PI - (lo / SAMPLES) * 2 * Math.PI;
    };

    const setup = () => {
      const css = getComputedStyle(document.documentElement);
      const dark = css.colorScheme === "dark" || document.documentElement.dataset.theme === "dark";
      PALETTE = dark ? PALETTES.dark : PALETTES.light;
      bg = css.getPropertyValue("--background").trim() || "#ffffff";
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = layer.width = W * dpr;
      canvas.height = layer.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      R = Math.min(W, H) * 0.38;
      cx = W / 2;
      cy = H / 2;
      ra = R * 1.3;
      rb = R * 0.27;
      ringFont = Math.max(10, R / 15);
      ctx.font = `600 ${ringFont}px ${MONO}`;
      step = ctx.measureText("M").width * 1.05;

      arc = [0];
      let prev = ringPoint(Math.PI);
      for (let k = 1; k <= SAMPLES; k++) {
        const p = ringPoint(Math.PI - (k / SAMPLES) * 2 * Math.PI);
        arc.push(arc[k - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
        prev = p;
      }
      perim = arc[SAMPLES];
      // Il testo deve entrare un numero intero di volte nell'orbita: niente giunture.
      // Se non ci sta nemmeno una volta, si rimpicciolisce il carattere invece di stringere le lettere
      const repeats = Math.max(1, Math.floor(perim / step / ring.length));
      const fitted = perim / (repeats * ring.length);
      if (fitted < step) ringFont *= fitted / step;
      step = fitted;

      paintGlobe();
    };

    // Sfondo e globo, una volta sola nell'immagine fuori schermo
    const paintGlobe = () => {
      const g = lctx;
      g.clearRect(0, 0, W, H);
      g.textAlign = "center";
      g.textBaseline = "middle";

      // Cifre 0/1 sparse sullo sfondo
      g.font = `${Math.max(9, W / 70)}px ${MONO}`;
      g.fillStyle = PALETTE.digits;
      for (let k = 0; k < 90; k++) {
        g.globalAlpha = 0.5 + hash(k, 3) * 0.5;
        g.fillText(hash(k, 1) < 0.5 ? "0" : "1", hash(k, 7) * W, hash(k, 11) * H);
      }

      // Celle più alte che larghe, come in un terminale
      const cw = (2 * R) / COLS;
      const ch = (2 * R) / ROWS;
      const fontSize = Math.min(ch * 0.92, cw * 1.75);
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const x = (i - COLS / 2 + 0.5) / (COLS / 2);
          const y = -(j - ROWS / 2 + 0.5) / (ROWS / 2);
          const d2 = x * x + y * y;
          if (d2 > 1) continue;
          const z = Math.sqrt(1 - d2);
          const yRot = y * COS_PHI + z * SIN_PHI;
          const zRot = -y * SIN_PHI + z * COS_PHI;
          const lat = Math.asin(Math.max(-1, Math.min(1, yRot))) / DEG;
          const lon = LAMBDA_0 / DEG + Math.atan2(x, zRot) / DEG;
          const light = Math.max(0, x * -0.35 + y * 0.45 + z * 0.82);
          // Verde in alto, verde acqua/azzurro in basso
          const tone = Math.min(1, Math.max(0, (0.55 - y) / 1.2));

          let char: string;
          if (isEuropeScaled(lat, lon)) {
            // Europa: caratteri densi, grassetto, colore pieno
            char = LAND_LIT[Math.floor(hash(i, j, 1) * LAND_LIT.length)];
            g.font = `800 ${fontSize}px ${MONO}`;
            g.globalAlpha = 0.85 + light * 0.15;
            g.fillStyle = PALETTE.europe;
          } else if (isLandAt(lat, lon) && !isEurope(lat, lon)) {
            // Altre terre: più leggere, per lasciare in primo piano l'Europa
            char = LAND_SHADE[Math.floor(hash(i, j, 1) * LAND_SHADE.length)];
            g.font = `600 ${fontSize}px ${MONO}`;
            g.globalAlpha = 0.6 + light * 0.3;
            g.fillStyle = mix(PALETTE.green, PALETTE.teal, 0.25 + tone * 0.6);
          } else {
            // Mare: metà delle celle vuote, solo punti leggeri azzurri
            if (hash(i, j) < 0.5) continue;
            char = SEA[Math.floor(hash(i, j, 2) * SEA.length)];
            g.font = `500 ${fontSize}px ${MONO}`;
            g.globalAlpha = 0.3 + light * 0.3;
            g.fillStyle = mix(PALETTE.green, PALETTE.teal, 0.9);
          }
          g.fillText(char, cx + x * R, cy - y * R);
        }
      }
      g.globalAlpha = 1;
    };

    const ringChars = (offset: number): RingChar[] => {
      const out: RingChar[] = [];
      const count = Math.round(perim / step);
      for (let k = 0; k < count; k++) {
        const t = paramAt(k * step + offset);
        const p = ringPoint(t);
        const q = ringPoint(t - 0.001);
        out.push({ ...p, angle: Math.atan2(q.y - p.y, q.x - p.x), char: ring[k % ring.length] });
      }
      return out;
    };

    const drawRing = (chars: RingChar[], front: boolean) => {
      ctx.font = `600 ${ringFont}px ${MONO}`;
      // La metà dietro è nascosta dove passa il globo
      const shown = chars.filter((c) => c.front === front && (front || Math.hypot(c.x - cx, c.y - cy) >= R * 1.02));
      const each = (paint: (c: RingChar) => void) => {
        for (const c of shown) {
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          paint(c);
          ctx.restore();
        }
      };
      if (front) {
        // Prima tutti i bordi del colore di fondo, poi le lettere: il testo resta leggibile sopra
        // il globo e il bordo di una lettera non copre quella accanto
        ctx.lineWidth = ringFont * 0.45;
        ctx.strokeStyle = bg;
        each((c) => ctx.strokeText(c.char, 0, 0));
      }
      ctx.fillStyle = front ? PALETTE.ring : PALETTE.ringBack;
      each((c) => ctx.fillText(c.char, 0, 0));
    };

    const frame = (time: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Un giro completo in circa 40 secondi
      const chars = ringChars(reduced ? 0 : (time / 40000) * perim);
      drawRing(chars, false);
      ctx.drawImage(layer, 0, 0, W, H);
      drawRing(chars, true);
    };

    setup();
    frame(0);

    let raf = 0;
    let visible = true;
    const loop = (now: number) => {
      if (visible) frame(now);
      raf = requestAnimationFrame(loop);
    };
    if (!reduced) raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    const refresh = () => {
      setup();
      frame(reduced ? 0 : performance.now());
    };
    const ro = new ResizeObserver(refresh);
    ro.observe(canvas);
    window.addEventListener("themechange", refresh);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", refresh);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("themechange", refresh);
      mq.removeEventListener("change", refresh);
    };
  }, [ring]);

  return <canvas ref={ref} role="img" aria-label={label} className={className} style={{ width: "100%", aspectRatio: "1" }} />;
}
