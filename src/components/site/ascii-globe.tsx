"use client";

import { useEffect, useRef } from "react";

/**
 * Globo di dati in caratteri ASCII che ruota lentamente: "continenti" verdi (colore
 * d'accento) su "oceani" blu, con l'ombreggiatura data dalla densità dei caratteri.
 * Disegnato su canvas; si ferma quando non è visibile e rispetta la riduzione del movimento.
 */

const RAMP = " .:-=+*#%@";
const COLS = 64;

// Terre emerse "inventate": somma di onde su latitudine e longitudine (stabile, nessun dato reale)
function landness(lat: number, lon: number) {
  return (
    Math.sin(lon * 2 + Math.sin(lat * 3) * 1.3) * 0.55 +
    Math.cos(lat * 4 - lon * 1.5) * 0.35 +
    Math.sin(lon * 5 + lat * 2) * 0.18 -
    Math.abs(lat) * 0.25
  );
}

export function AsciiGlobe({ className, label }: { className?: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    let rot = 0.6;
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const r = COLS / 2 - 1;
      for (let j = 0; j < COLS; j++) {
        for (let i = 0; i < COLS; i++) {
          const x = (i - COLS / 2 + 0.5) / r;
          const y = (j - COLS / 2 + 0.5) / r;
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
          const lat = Math.asin(-y);
          const lon = Math.atan2(x, z) + rot;
          const light = Math.max(0, x * -0.35 + -y * 0.35 + z * 0.87); // luce da in alto a sinistra
          const land = landness(lat, lon) > 0.18;
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

    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (visible) {
        rot += dt * 0.00018;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    if (reduced) draw();
    else raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
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
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("themechange", onTheme);
      mq.removeEventListener("change", onTheme);
    };
  }, []);

  return <canvas ref={ref} role="img" aria-label={label} className={className} style={{ width: "100%", aspectRatio: "1" }} />;
}
