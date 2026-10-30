"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { SUPPLY_HUBS, TRANSPORT_ROUTES, TransportRoute } from "./simulation-data";

const RAMP = " .:-=+*#%@";
const COLS = 64;

// Realistic continent detection with lat/lon bounding zones
function isContinent(lat: number, lon: number): boolean {
  // Americas
  if (lat > 15 && lat < 72 && lon > -168 && lon < -52) {
    if (lat < 28 && lon > -100 && lon < -75) return true; // Central America
    return true;
  }
  if (lat > -56 && lat <= 12 && lon > -82 && lon < -34) return true; // South America
  // Europe
  if (lat > 35 && lat < 71 && lon > -10 && lon < 42) return true;
  // Africa
  if (lat > -35 && lat < 37 && lon > -18 && lon < 52) return true;
  // Asia
  if (lat > 8 && lat < 75 && lon > 42 && lon < 145) {
    if (lat < 26 && lon > 42 && lon < 60) return false; // Arabian sea
    return true;
  }
  // India
  if (lat > 8 && lat < 28 && lon > 68 && lon < 92) return true;
  // Australia & Oceania
  if (lat > -44 && lat < -10 && lon > 112 && lon < 155) return true;
  // Japan
  if (lat > 30 && lat < 46 && lon > 129 && lon < 146) return true;
  return false;
}

// Convert lat/lon to 3D Cartesian coordinates on unit sphere
function toCartesian(lat: number, lon: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  return [
    Math.cos(phi) * Math.sin(theta),
    Math.sin(phi),
    Math.cos(phi) * Math.cos(theta),
  ];
}

// Compute normal of great circle plane between two points on unit sphere
function getGreatCircleNormal(p1: [number, number, number], p2: [number, number, number]): [number, number, number] {
  const nx = p1[1] * p2[2] - p1[2] * p2[1];
  const ny = p1[2] * p2[0] - p1[0] * p2[2];
  const nz = p1[0] * p2[1] - p1[1] * p2[0];
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

interface InteractiveAsciiGlobeProps {
  className?: string;
  activeRouteId?: string | null;
  onSelectRoute?: (route: TransportRoute) => void;
}

export function InteractiveAsciiGlobe({
  className = "",
  activeRouteId = null,
  onSelectRoute,
}: InteractiveAsciiGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);

  // Rotation states
  const rotLonRef = useRef(0.4);
  const rotTiltRef = useRef(0.18);
  const isDraggingRef = useRef(false);
  const previousPointerRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ lon: 0, tilt: 0 });
  const activeRouteIdRef = useRef(activeRouteId);
  activeRouteIdRef.current = activeRouteId;
  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  // Precompute hub positions
  const hubsCartesian = Object.values(SUPPLY_HUBS).map((h) => ({
    hub: h,
    vec: toCartesian(h.lat, h.lon),
  }));

  // Precompute route great circle geometry
  const routeGeometries = TRANSPORT_ROUTES.map((r) => {
    const fromH = SUPPLY_HUBS[r.fromHub];
    const toH = SUPPLY_HUBS[r.toHub];
    const vFrom = toCartesian(fromH.lat, fromH.lon);
    const vTo = toCartesian(toH.lat, toH.lon);
    const normal = getGreatCircleNormal(vFrom, vTo);
    const angleTotal = Math.acos(
      Math.max(-1, Math.min(1, vFrom[0] * vTo[0] + vFrom[1] * vTo[1] + vFrom[2] * vTo[2]))
    );
    return {
      route: r,
      vFrom,
      vTo,
      normal,
      angleTotal,
    };
  });

  // Focus smooth transition to a target hub
  const focusHub = useCallback((lat: number, lon: number) => {
    const targetLon = -((lon * Math.PI) / 180);
    const targetTilt = (lat * Math.PI) / 180;
    rotLonRef.current = targetLon;
    rotTiltRef.current = Math.max(-0.6, Math.min(0.6, targetTilt));
    velocityRef.current = { lon: 0, tilt: 0 };
  }, []);

  // Sync active route focus from props or global event
  useEffect(() => {
    if (activeRouteId) {
      const r = TRANSPORT_ROUTES.find((tr) => tr.id === activeRouteId);
      if (r) {
        const fromH = SUPPLY_HUBS[r.fromHub];
        focusHub(fromH.lat, fromH.lon);
      }
    }
  }, [activeRouteId, focusHub]);

  useEffect(() => {
    const handleRouteSelect = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const routeId = customEvent.detail;
      const r = TRANSPORT_ROUTES.find((tr) => tr.id === routeId);
      if (r) {
        const fromH = SUPPLY_HUBS[r.fromHub];
        focusHub(fromH.lat, fromH.lon);
        // Also scroll smoothly to top so globe is visible if requested
        const canvas = canvasRef.current;
        if (canvas && window.scrollY > 400) {
          canvas.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };
    window.addEventListener("dpp-route-select", handleRouteSelect);
    return () => window.removeEventListener("dpp-route-select", handleRouteSelect);
  }, [focusHub]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let colors = {
      land: "#257345",
      sea: "#2f6fd1",
      pulse: "#38bdf8",
      amber: "#f59e0b",
      faint: "#cfcfcf",
      textBg: "rgba(0, 0, 0, 0.4)",
    };

    const readThemeColors = () => {
      const css = getComputedStyle(document.documentElement);
      const dark =
        document.documentElement.dataset.theme === "dark" ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      colors = {
        land: css.getPropertyValue("--primary").trim() || (dark ? "#99dda9" : "#257345"),
        sea: dark ? "#6ea8ff" : "#2f6fd1",
        pulse: dark ? "#38bdf8" : "#0284c7",
        amber: dark ? "#fbbf24" : "#d97706",
        faint: css.getPropertyValue("--input").trim() || (dark ? "#404040" : "#cfcfcf"),
        textBg: dark ? "rgba(17, 17, 17, 0.85)" : "rgba(255, 255, 255, 0.85)",
      };
    };
    readThemeColors();

    let size = 0;
    let cell = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = size / COLS;
      ctx.font = `${cell * 1.15}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };
    resize();

    let rafId = 0;
    let lastTime = performance.now();
    let animTime = 0;
    let isVisible = true;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const r = COLS / 2 - 1;
      const cosTilt = Math.cos(rotTiltRef.current);
      const sinTilt = Math.sin(rotTiltRef.current);

      for (let j = 0; j < COLS; j++) {
        for (let i = 0; i < COLS; i++) {
          const screenX = (i - COLS / 2 + 0.5) / r;
          const screenY = (j - COLS / 2 + 0.5) / r;
          const d2 = screenX * screenX + screenY * screenY;
          const px = (i + 0.5) * cell;
          const py = (j + 0.5) * cell;

          // Outer halo around globe
          if (d2 > 1) {
            if (d2 < 1.05 && (i + j) % 3 === 0) {
              ctx.fillStyle = colors.faint;
              ctx.fillText("·", px, py);
            }
            continue;
          }

          // 3D sphere coordinate (screen space: screenX, -screenY, zFront)
          const zFront = Math.sqrt(1 - d2);

          // Apply Tilt (rotation around X axis)
          const yTilted = -screenY * cosTilt - zFront * sinTilt;
          const zTilted = zFront * cosTilt - -screenY * sinTilt;
          const xTilted = screenX;

          // Lat/Lon on the rotated sphere
          const lat = (Math.asin(Math.max(-1, Math.min(1, yTilted))) * 180) / Math.PI;
          const lon =
            (Math.atan2(xTilted, zTilted) * 180) / Math.PI -
            (rotLonRef.current * 180) / Math.PI;
          const normalizedLon = ((((lon + 180) % 360) + 360) % 360) - 180;

          // World Cartesian point (for distance to hubs and routes)
          const pCart = toCartesian(lat, normalizedLon);

          // Check if point is on an active supply chain hub
          let isHub = false;
          let hubLabel = "";
          for (const hc of hubsCartesian) {
            const dot = pCart[0] * hc.vec[0] + pCart[1] * hc.vec[1] + pCart[2] * hc.vec[2];
            if (dot > 0.994 && zFront > 0.1) {
              isHub = true;
              hubLabel = hc.hub.city;
              break;
            }
          }

          // Check if point is along an active transport route
          let isRoutePulse = false;
          let routeChar = "";
          for (const rg of routeGeometries) {
            const distToPlane = Math.abs(
              pCart[0] * rg.normal[0] + pCart[1] * rg.normal[1] + pCart[2] * rg.normal[2]
            );
            // Close to the great-circle arc
            if (distToPlane < 0.045 && zFront > 0.05) {
              // Check if between start and end
              const dotFrom = pCart[0] * rg.vFrom[0] + pCart[1] * rg.vFrom[1] + pCart[2] * rg.vFrom[2];
              const dotTo = pCart[0] * rg.vTo[0] + pCart[1] * rg.vTo[1] + pCart[2] * rg.vTo[2];
              const cosTot = Math.cos(rg.angleTotal);
              if (dotFrom > cosTot && dotTo > cosTot) {
                // Moving pulse along the route
                const angleFromStart = Math.acos(Math.max(-1, Math.min(1, dotFrom)));
                const progressAlong = angleFromStart / rg.angleTotal;
                const pulse = (progressAlong - animTime * 0.25) % 1.0;
                const normPulse = (pulse + 1.0) % 1.0;

                if (normPulse > 0.82) {
                  isRoutePulse = true;
                  routeChar = normPulse > 0.92 ? "▲" : "»";
                  break;
                } else if ((i + j) % 2 === 0) {
                  isRoutePulse = true;
                  routeChar = "·";
                }
              }
            }
          }

          // Check expanding ripple wave from hubs
          let isWave = false;
          for (const hc of hubsCartesian) {
            const angleDist = Math.acos(
              Math.max(-1, Math.min(1, pCart[0] * hc.vec[0] + pCart[1] * hc.vec[1] + pCart[2] * hc.vec[2]))
            );
            const waveRadius = (animTime * 0.45) % 0.85;
            if (Math.abs(angleDist - waveRadius) < 0.035 && zFront > 0.15) {
              isWave = true;
              break;
            }
          }

          // Lighting from top-left
          const light = Math.max(0, screenX * -0.35 + -screenY * 0.35 + zFront * 0.87);

          if (isHub) {
            ctx.fillStyle = colors.amber;
            ctx.fillText("●", px, py);
          } else if (isRoutePulse) {
            ctx.fillStyle = colors.pulse;
            ctx.fillText(routeChar || ">", px, py);
          } else if (isWave) {
            ctx.fillStyle = colors.pulse;
            ctx.fillText("o", px, py);
          } else {
            const land = isContinent(lat, normalizedLon);
            const level = land
              ? Math.min(RAMP.length - 1, Math.max(3, Math.round(light * 9)))
              : Math.min(2, Math.max(1, Math.round(light * 2.4)));

            ctx.globalAlpha = 0.35 + light * 0.65;
            ctx.fillStyle = land ? colors.land : colors.sea;
            ctx.fillText(RAMP[level], px, py);
          }
          ctx.globalAlpha = 1;
        }
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(64, now - lastTime);
      lastTime = now;

      if (isVisible) {
        animTime += dt * 0.001;

        // Inertial damping when dragging ceases
        if (!isDraggingRef.current) {
          velocityRef.current.lon *= 0.92;
          velocityRef.current.tilt *= 0.92;
          rotLonRef.current += velocityRef.current.lon;
          rotTiltRef.current = Math.max(-0.6, Math.min(0.6, rotTiltRef.current + velocityRef.current.tilt));

          // Natural auto-rotation
          if (isRotatingRef.current && Math.abs(velocityRef.current.lon) < 0.0001) {
            rotLonRef.current += dt * 0.00022;
          }
        }
        draw();
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    // Pointer event listeners for interactive rotation
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousPointerRef.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - previousPointerRef.current.x;
      const dy = e.clientY - previousPointerRef.current.y;
      const sensitivity = 0.005;

      velocityRef.current = { lon: -dx * sensitivity, tilt: -dy * sensitivity };
      rotLonRef.current += velocityRef.current.lon;
      rotTiltRef.current = Math.max(-0.6, Math.min(0.6, rotTiltRef.current + velocityRef.current.tilt));

      previousPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(canvas);

    const onTheme = () => {
      readThemeColors();
      draw();
    };
    window.addEventListener("themechange", onTheme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onTheme);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("themechange", onTheme);
      mq.removeEventListener("change", onTheme);
    };
  }, []);

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* ASCII Globe Canvas */}
      <div className="relative w-full max-w-[560px] aspect-square rounded-2xl border border-border bg-card/60 backdrop-blur-md p-2 shadow-sm overflow-hidden">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Globo ASCII interattivo con rotte di trasporto e monitoraggio emissioni CO₂"
          className="h-full w-full block cursor-grab active:cursor-grabbing select-none"
        />

        {/* Floating Top Controls (Play/Pause, Reset) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/85 px-3 py-1 text-[11px] font-mono text-muted-foreground backdrop-blur-md shadow-sm pointer-events-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE FLUX · CO₂ TELEMETRY</span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsRotating(!isRotating)}
              className="rounded-lg border border-border bg-background/85 px-2.5 py-1 text-xs font-mono text-muted-foreground backdrop-blur-md hover:text-foreground transition-colors shadow-sm"
              title={isRotating ? "Metti in pausa rotazione" : "Avvia rotazione"}
            >
              {isRotating ? "[⏸ PAUSA]" : "[▶ AVVIA]"}
            </button>
            <button
              type="button"
              onClick={() => {
                rotLonRef.current = 0.4;
                rotTiltRef.current = 0.18;
                velocityRef.current = { lon: 0, tilt: 0 };
              }}
              className="rounded-lg border border-border bg-background/85 px-2.5 py-1 text-xs font-mono text-muted-foreground backdrop-blur-md hover:text-foreground transition-colors shadow-sm"
              title="Centra la visuale"
            >
              [↺ RESET]
            </button>
          </div>
        </div>

        {/* Legend / Status at bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/85 px-2 py-0.5 backdrop-blur-md">
            <span className="text-amber-500">●</span> Hub <span className="text-sky-500 ml-1.5">»</span> Tratta
          </span>
          <span className="hidden sm:inline-block rounded-md border border-border/80 bg-background/85 px-2 py-0.5 backdrop-blur-md">
            Trascina per ruotare · Tilt 3D
          </span>
        </div>
      </div>
    </div>
  );
}
