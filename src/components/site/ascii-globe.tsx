"use client";

import { useEffect, useRef } from "react";

/**
 * Globo di caratteri ASCII su fondo scuro, vista fissa sull'Europa, senza animazioni.
 * - fondo: cifre 0/1 sparse e tenui
 * - globo: caratteri densi verde chiaro sulle terre illuminate, che sfumano in verde acqua
 *   e azzurro verso il basso; mare con caratteri radi
 * - anello inclinato con le sigle di norme e regolamenti (testo passato da fuori):
 *   la metà dietro è tenue e nascosta dal globo, quella davanti è in primo piano
 * Si ridisegna solo al ridimensionamento.
 */

const COLS = 60;
const ROWS = 40;
const LAND_LIT = "B8&@$#%";
const LAND_SHADE = "x+*=%#";
const SEA = "=+x*:·=+x*.'";

const DEG = Math.PI / 180;
const PHI_0 = 44 * DEG;
const LAMBDA_0 = 14 * DEG;
const COS_PHI = Math.cos(PHI_0);
const SIN_PHI = Math.sin(PHI_0);

const PALETTE = {
  bg: "#0c1213",
  digits: "#1e2b29",
  green: [166, 227, 176] as const,
  teal: [111, 168, 196] as const,
  ring: "#aab6ff",
  ringBack: "#3d4c8a",
};

// Terre emerse in vista: Europa, Nord Africa e Medio Oriente (approssimazione per riquadri)
function isLand(lat: number, rawLon: number): boolean {
  const lon = ((((rawLon + 180) % 360) + 360) % 360) - 180;

  if (lat < 36 && lon < -15) return false;
  if (lat >= 36 && lat < 50 && lon < -10) return false;
  if (lat >= 50 && lat < 60 && lon < -11) return false;
  if (lat >= 60 && lon < -5 && !(lat >= 63 && lat <= 67 && lon >= -25 && lon <= -13)) return false;
  if (lat > 43.8 && lat < 47.8 && lon > -8.5 && lon < -1.5) return false;
  if (lat > 49.8 && lat < 51.2 && lon > -4.5 && lon < 1.2 && !(lat > 50.8 && lon < 0)) return false;
  if (lat > 51.8 && lat < 55.0 && lon > -6.0 && lon < -3.5) return false;
  if (lat > 35.8 && lat < 36.6 && lon > -5.5 && lon < -0.5) return false;
  if (lat > 36.8 && lat < 42.5 && lon > 2.5 && lon < 8.2) return false;
  if (lat > 38.2 && lat < 42.8 && lon > 9.8 && lon < 13.5) return false;
  if (lat > 32.5 && lat < 38.0 && lon > 11.5 && lon < 21.0 && !(lat > 36.5 && lat < 38.3 && lon > 12.5 && lon < 15.5)) return false;
  if (lat > 41.2 && lat < 45.4 && lon > 13.5 && lon < 19.5) return false;
  if (lat > 31.5 && lat < 39.5 && lon > 23.5 && lon < 34.5) return false;
  if (lat > 41.0 && lat < 47.0 && lon > 28.0 && lon < 41.5) return false;
  if (lat > 54.0 && lat < 60.0 && lon > 14.5 && lon < 24.0) return false;
  if (lat >= 60.0 && lat < 66.0 && lon > 17.5 && lon < 25.5) return false;
  if (lat > 52.5 && lat < 60.0 && lon > 1.8 && lon < 7.5 && !(lat > 54.5 && lat < 58.0 && lon > 7.5)) return false;
  if (lat > 12.5 && lat < 30 && lon > 32.5 + (30 - lat) * 0.55 && lon < 35 + (30 - lat) * 0.75) return false;
  if (lat > 24 && lat < 30.5 && lon > 48 && lon < 56.5) return false;

  if (lat >= 37.8 && lat <= 46.5 && lon >= 7.5 && lon <= 18.5) return true;
  if (lat >= 36.5 && lat <= 38.5 && lon >= 12.0 && lon <= 15.5) return true;
  if (lat >= 38.8 && lat <= 43.2 && lon >= 8.2 && lon <= 9.8) return true;
  if (lat >= 36.0 && lat <= 43.8 && lon >= -9.5 && lon <= 3.5) return true;
  if (lat >= 43.5 && lat <= 55.0 && lon >= -4.5 && lon <= 25.0) return true;
  if (lat >= 50.0 && lat <= 59.0 && lon >= -10.5 && lon <= 2.0) return true;
  if (lat >= 54.5 && lat <= 57.8 && lon >= 8.0 && lon <= 12.8) return true;
  if (lat >= 57.5 && lat <= 71.0 && lon >= 4.5 && lon <= 32.0) return true;
  if (lat >= 44.0 && lat <= 72.0 && lon >= 20.0 && lon <= 60.0) return true;
  if (lat >= 36.0 && lat <= 44.0 && lon >= 19.5 && lon <= 44.0) return true;
  if (lat >= 18.0 && lat <= 37.0 && lon >= -17.0 && lon <= 36.0) {
    if (lat > 33.5 && lon > 11.5 && lon < 24.0) return false;
    return true;
  }
  if (lat >= 12.0 && lat <= 38.0 && lon >= 34.0 && lon <= 60.0) return true;
  if (lat >= 63.0 && lat <= 67.0 && lon >= -25.0 && lon <= -13.0) return true;
  return false;
}

// Numero pseudo-casuale stabile in [0, 1): stesso disegno a ogni caricamento
function hash(i: number, j: number, k = 0) {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const mix = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(",")})`;

export function AsciiGlobe({ className, label, ring }: { className?: string; label: string; ring: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, W, H);

      // Cifre 0/1 sparse sullo sfondo
      ctx.font = `${Math.max(9, W / 70)}px ${MONO}`;
      ctx.fillStyle = PALETTE.digits;
      for (let k = 0; k < 90; k++) {
        ctx.globalAlpha = 0.5 + hash(k, 3) * 0.5;
        ctx.fillText(hash(k, 1) < 0.5 ? "0" : "1", hash(k, 7) * W, hash(k, 11) * H);
      }
      ctx.globalAlpha = 1;

      // Globo: disco centrato, celle più alte che larghe come in un terminale
      const R = Math.min(W, H) * 0.38;
      const cx = W / 2;
      const cy = H / 2;
      const cw = (2 * R) / COLS;
      const ch = (2 * R) / ROWS;

      // Anello: ellisse inclinata intorno al globo, testo carattere per carattere lungo il bordo
      const tilt = -11 * DEG;
      const ra = R * 1.3;
      const rb = R * 0.2;
      const ringFont = Math.max(10, R / 15);
      ctx.font = `600 ${ringFont}px ${MONO}`;
      const step = ctx.measureText("M").width * 1.05;
      const ringPoint = (t: number) => {
        const ex = ra * Math.cos(t);
        const ey = rb * Math.sin(t);
        return {
          x: cx + ex * Math.cos(tilt) - ey * Math.sin(tilt),
          y: cy + ex * Math.sin(tilt) + ey * Math.cos(tilt),
          front: Math.sin(t) > 0, // metà inferiore dell'ellisse: davanti al globo
        };
      };
      // Il testo avanza a passi di lunghezza costante lungo l'ellisse, per un giro completo
      const ringChars: { x: number; y: number; angle: number; front: boolean; char: string }[] = [];
      for (let t = Math.PI, k = 0; t > -Math.PI; k++) {
        const p = ringPoint(t);
        const q = ringPoint(t - 0.001);
        ringChars.push({ ...p, angle: Math.atan2(q.y - p.y, q.x - p.x), char: ring[k % ring.length] });
        t -= step / Math.hypot(ra * Math.sin(t), rb * Math.cos(t));
      }
      const drawRing = (front: boolean) => {
        ctx.font = `600 ${ringFont}px ${MONO}`;
        for (const c of ringChars) {
          if (c.front !== front) continue;
          // La metà dietro è nascosta dove passa il globo
          if (!front && Math.hypot(c.x - cx, c.y - cy) < R * 1.02) continue;
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          if (front) {
            // Bordo scuro: il testo resta leggibile sopra i caratteri del globo
            ctx.lineWidth = ringFont * 0.45;
            ctx.strokeStyle = PALETTE.bg;
            ctx.strokeText(c.char, 0, 0);
          }
          ctx.fillStyle = front ? PALETTE.ring : PALETTE.ringBack;
          ctx.fillText(c.char, 0, 0);
          ctx.restore();
        }
      };

      drawRing(false);

      ctx.font = `600 ${Math.min(ch * 0.92, cw * 1.75)}px ${MONO}`;
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
          const land = isLand(lat, lon);
          // Verde in alto, verde acqua/azzurro in basso
          const tone = Math.min(1, Math.max(0, (0.55 - y) / 1.2));

          let char: string;
          if (land) {
            const set = light > 0.55 ? LAND_LIT : LAND_SHADE;
            char = set[Math.floor(hash(i, j, 1) * set.length)];
            ctx.globalAlpha = 0.7 + light * 0.3;
          } else {
            // Mare: un quarto delle celle vuote, caratteri più leggeri e più tenui delle terre
            if (hash(i, j) < 0.25) continue;
            char = SEA[Math.floor(hash(i, j, 2) * SEA.length)];
            ctx.globalAlpha = 0.4 + light * 0.4;
          }
          ctx.fillStyle = mix(PALETTE.green, PALETTE.teal, land ? tone * 0.7 : Math.min(1, tone + 0.3));
          ctx.fillText(char, cx + x * R, cy - y * R);
        }
      }
      ctx.globalAlpha = 1;

      drawRing(true);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [ring]);

  return <canvas ref={ref} role="img" aria-label={label} className={className} style={{ width: "100%", aspectRatio: "1" }} />;
}
