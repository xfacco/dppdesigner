"use client";

import React, { useEffect, useState } from "react";
import { TRANSPORT_ROUTES, TransportRoute } from "./simulation-data";

interface TransportSimulationProps {
  activeRouteId?: string | null;
  onSelectRoute?: (route: TransportRoute) => void;
}

export function TransportSimulation({
  activeRouteId = null,
  onSelectRoute,
}: TransportSimulationProps) {
  // Live ticking CO2 counter
  const [liveEmissions, setLiveEmissions] = useState(1420.35);
  const [avoidedCo2, setAvoidedCo2] = useState(3840.12);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveEmissions((prev) => prev + 0.14);
      setAvoidedCo2((prev) => prev + 0.38);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="disclosures"
      aria-labelledby="disclosures-title"
      className="mt-16 pt-10 border-t border-border grid gap-8 md:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.15fr)] md:gap-10 scroll-mt-8"
    >
      {/* Left Column: Title, Explanatory Copy & Live Monospace Telemetry */}
      <div>
        <h2
          id="disclosures-title"
          className="text-2xl font-medium tracking-tight text-foreground md:text-3xl"
        >
          Tracciabilità & Simulazione CO₂
        </h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Simulazione in tempo reale della catena del valore e delle emissioni
          di gas serra associate a ciascun passaggio del Passaporto Digitale
          di Prodotto (ESPR Regolamento UE 2024/1781).
        </p>

        {/* Live Monospace Metrics Terminal Card */}
        <div className="mt-6 rounded-xl border border-border bg-card/80 p-4 font-mono text-xs space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-muted-foreground uppercase text-[11px]">
              STATUS TELEMETRIA
            </span>
            <span className="inline-flex items-center gap-1.5 text-primary font-semibold text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              ONLINE · SYNC LEDGER
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>CO₂ EMESSO (SESSIONE)</span>
              <span className="text-foreground font-bold">
                {liveEmissions.toFixed(2)} kg CO₂e
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>CO₂ EVITATO CON IL DPP</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                -{avoidedCo2.toFixed(2)} kg CO₂e (-64.8%)
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>INDICE CIRCOLARITÀ (MCI)</span>
              <span className="text-foreground font-bold">0.88 / 1.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>STANDARD DI CONFORMITÀ</span>
              <span className="text-primary font-semibold">PEF / ISO 14067</span>
            </div>
          </div>

          <div className="pt-1 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between">
            <span>FLOTTE ATTIVE: 4 TRATTE</span>
            <span>AGGIORNAMENTO: 1s</span>
          </div>
        </div>
      </div>

      {/* Right Column: Transport Disclosures List (styled like patchtheplanet disclosures-list) */}
      <div>
        <ul className="space-y-6 list-none p-0 m-0">
          {TRANSPORT_ROUTES.map((route) => {
            const isSelected = activeRouteId === route.id;
            return (
              <li
                key={route.id}
                onClick={() => {
                  onSelectRoute?.(route);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("dpp-route-select", { detail: route.id })
                    );
                  }
                }}
                className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card/40 hover:border-foreground/40 hover:bg-card/90"
                }`}
              >
                {/* Meta header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-wide">
                    {route.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${
                      route.status === "In Transito"
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                        : route.status === "Verificato DPP"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {route.status} · {route.eta}
                  </span>
                </div>

                {/* Title & Arrow */}
                <div className="flex items-center justify-between">
                  <strong className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {route.title}
                  </strong>
                  <span
                    aria-hidden
                    className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    ↗
                  </span>
                </div>

                {/* Product & Transportation Mode */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono">
                  <span>Prodotto: <span className="text-foreground">{route.product}</span></span>
                  <span>·</span>
                  <span>{route.modeLabel}</span>
                  <span>·</span>
                  <span>{route.distanceKm.toLocaleString("it-IT")} km</span>
                </div>

                {/* CO2 Metric & Savings */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                    🌱 {route.co2Rate}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    -{route.co2SavingsPercent}% CO₂ vs benchmark convenzionale
                  </span>
                </div>

                {/* Summary & Certifications */}
                <p className="mt-2.5 text-xs text-muted-foreground leading-normal">
                  {route.summary}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50 text-[11px] font-mono">
                  <span className="text-muted-foreground">CERTIFICAZIONI:</span>
                  {route.certifications.map((c) => (
                    <span
                      key={c}
                      className="rounded bg-muted px-1.5 py-0.5 text-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
