"use client";

import { useEffect, useRef } from "react";

/**
 * Globo di caratteri ASCII fisso con focus centrato sull'Europa.
 * Disegnato su canvas: terre emerse verdi (colore d'accento --primary)
 * su oceani blu, con ombreggiatura data dalla densità dei caratteri.
 * Non gira (fisso), si ridisegna su resize e cambio tema.
 */

const RAMP = " .:-=+*#%@";
const COLS = 64;

// Coordinate del centro di proiezione (Europa centrale)
const PHI_0 = (48 * Math.PI) / 180; // ~48° Nord
const LAMBDA_0 = (11 * Math.PI) / 180; // ~11° Est
const COS_PHI = Math.cos(PHI_0);
const SIN_PHI = Math.sin(PHI_0);

// Riconoscimento geografico dettagliato del continente europeo e bacini limitrofi
function isEuropeLand(lat: number, rawLon: number): boolean {
  const lon = ((((rawLon + 180) % 360) + 360) % 360) - 180;

  // Esclusioni masse d'acqua:
  // Oceano Atlantico a ovest dell'Europa
  if (lat < 36 && lon < -15) return false;
  if (lat >= 36 && lat < 50 && lon < -10) return false;
  if (lat >= 50 && lat < 60 && lon < -11) return false;
  if (lat >= 60 && lon < -5 && !(lat >= 63 && lat <= 67 && lon >= -25 && lon <= -13)) return false; // solo Islanda

  // Golfo di Biscaglia (tra Francia e Spagna)
  if (lat > 43.8 && lat < 47.8 && lon > -8.5 && lon < -1.5) return false;

  // Canale della Manica (tra Gran Bretagna e Francia)
  if (lat > 49.8 && lat < 51.2 && lon > -4.5 && lon < 1.2 && !(lat > 50.8 && lon < 0)) return false;

  // Mare d'Irlanda
  if (lat > 51.8 && lat < 55.0 && lon > -6.0 && lon < -3.5) return false;

  // Mar Mediterraneo
  // Mare di Alboran (tra Spagna e Marocco)
  if (lat > 35.8 && lat < 36.6 && lon > -5.5 && lon < -0.5) return false;
  // Mediterraneo occidentale (tra Baleari e Sardegna)
  if (lat > 36.8 && lat < 42.5 && lon > 2.5 && lon < 8.2) return false;
  // Mar Tirreno (tra Sardegna/Corsica e costa tirrenica)
  if (lat > 38.2 && lat < 42.8 && lon > 9.8 && lon < 13.5) return false;
  // Mar Ionio / Canale di Sicilia (a sud dello stivale)
  if (
    lat > 32.5 &&
    lat < 38.0 &&
    lon > 11.5 &&
    lon < 21.0 &&
    !(lat > 36.5 && lat < 38.3 && lon > 12.5 && lon < 15.5) // Sicilia
  ) {
    return false;
  }
  // Mare Adriatico (tra Italia e Balcani)
  if (lat > 41.2 && lat < 45.4 && lon > 13.5 && lon < 19.5) return false;
  // Mare Egeo e Mediterraneo orientale
  if (lat > 31.5 && lat < 39.5 && lon > 23.5 && lon < 34.5) return false;

  // Mar Nero
  if (lat > 41.0 && lat < 47.0 && lon > 28.0 && lon < 41.5) return false;

  // Mar Baltico e Golfo di Botnia
  if (lat > 54.0 && lat < 60.0 && lon > 14.5 && lon < 24.0) return false;
  if (lat >= 60.0 && lat < 66.0 && lon > 17.5 && lon < 25.5) return false;

  // Mare del Nord
  if (lat > 52.5 && lat < 60.0 && lon > 1.8 && lon < 7.5 && !(lat > 54.5 && lat < 58.0 && lon > 7.5)) return false;

  // Terre emerse:
  // Italia (penisola a stivale)
  if (lat >= 37.8 && lat <= 46.5 && lon >= 7.5 && lon <= 18.5) return true;
  // Sicilia, Sardegna e Corsica
  if (lat >= 36.5 && lat <= 38.5 && lon >= 12.0 && lon <= 15.5) return true;
  if (lat >= 38.8 && lat <= 43.2 && lon >= 8.2 && lon <= 9.8) return true;

  // Penisola Iberica (Spagna e Portogallo)
  if (lat >= 36.0 && lat <= 43.8 && lon >= -9.5 && lon <= 3.5) return true;

  // Francia, Benelux, Germania e Europa Centrale
  if (lat >= 43.5 && lat <= 55.0 && lon >= -4.5 && lon <= 25.0) return true;

  // Isole Britanniche (Regno Unito e Irlanda)
  if (lat >= 50.0 && lat <= 59.0 && lon >= -10.5 && lon <= 2.0) return true;

  // Scandinavia (Norvegia, Svezia, Finlandia, Danimarca)
  if (lat >= 54.5 && lat <= 57.8 && lon >= 8.0 && lon <= 12.8) return true; // Danimarca
  if (lat >= 57.5 && lat <= 71.0 && lon >= 4.5 && lon <= 32.0) return true;

  // Europa dell'Est e Russia occidentale
  if (lat >= 44.0 && lat <= 72.0 && lon >= 20.0 && lon <= 60.0) return true;

  // Balcani, Grecia e Turchia
  if (lat >= 36.0 && lat <= 44.0 && lon >= 19.5 && lon <= 44.0) return true;

  // Nord Africa visibile nel quadrante meridionale
  if (lat >= 18.0 && lat <= 37.0 && lon >= -17.0 && lon <= 36.0) {
    if (lat > 33.5 && lon > 11.5 && lon < 24.0) return false; // Golfo della Sirte
    return true;
  }

  // Medio Oriente visibile a sud-est
  if (lat >= 12.0 && lat <= 38.0 && lon >= 34.0 && lon <= 60.0) return true;

  // Islanda
  if (lat >= 63.0 && lat <= 67.0 && lon >= -25.0 && lon <= -13.0) return true;

  return false;
}

export function AsciiGlobe({ className, label }: { className?: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let colors = { land: "#257345", sea: "#2f6fd1", faint: "#cfcfcf" };
    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      const dark = css.colorScheme === "dark" || document.documentElement.dataset.theme === "dark";
      colors = {
        land: css.getPropertyValue("--primary").trim() || "#257345",
        sea: dark ? "#6ea8ff" : "#2f6fd1",
        faint: css.getPropertyValue("--input").trim() || "#cfcfcf",
      };
    };
    readColors();

    let size = 0;
    let cell = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = size / COLS;
      ctx.font = `${cell * 1.15}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };
    resize();

    // Disegno fisso (nessuna rotazione, fisso con focus sull'Europa)
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const r = COLS / 2 - 1;

      for (let j = 0; j < COLS; j++) {
        for (let i = 0; i < COLS; i++) {
          const x = (i - COLS / 2 + 0.5) / r;
          const y = -(j - COLS / 2 + 0.5) / r;
          const d2 = x * x + y * y;
          const px = (i + 0.5) * cell;
          const py = (j + 0.5) * cell;

          if (d2 > 1) {
            // Anello sottile intorno al globo
            if (d2 < 1.06 && (i + j) % 3 === 0) {
              ctx.fillStyle = colors.faint;
              ctx.fillText("·", px, py);
            }
            continue;
          }

          const z = Math.sqrt(1 - d2);

          // Rotazione ortogonale con inclinazione fissa verso l'Europa
          const yRot = y * COS_PHI + z * SIN_PHI;
          const zRot = -y * SIN_PHI + z * COS_PHI;

          const lat = (Math.asin(Math.max(-1, Math.min(1, yRot))) * 180) / Math.PI;
          const lonRel = (Math.atan2(x, zRot) * 180) / Math.PI;
          const lon = (LAMBDA_0 * 180) / Math.PI + lonRel;

          // Luce da in alto a sinistra
          const light = Math.max(0, x * -0.35 + y * 0.35 + z * 0.87);
          const land = isEuropeLand(lat, lon);

          // Oceani con caratteri leggeri (. e :), terre con caratteri densi
          const level = land
            ? Math.min(RAMP.length - 1, Math.max(3, Math.round(light * 9)))
            : Math.min(2, Math.max(1, Math.round(light * 2.4)));

          ctx.globalAlpha = 0.35 + light * 0.65;
          ctx.fillStyle = land ? colors.land : colors.sea;
          ctx.fillText(RAMP[level], px, py);
        }
      }
      ctx.globalAlpha = 1;
    };

    draw();

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    const onTheme = () => {
      readColors();
      draw();
    };
    window.addEventListener("themechange", onTheme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onTheme);

    return () => {
      ro.disconnect();
      window.removeEventListener("themechange", onTheme);
      mq.removeEventListener("change", onTheme);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      className={className}
      style={{ width: "100%", aspectRatio: "1" }}
    />
  );
}
