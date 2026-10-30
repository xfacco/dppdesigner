"use client";

import React from "react";
import { SupplyChainNode, ProductPart, CircularPhase } from "./data";

interface DppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: SupplyChainNode | null;
  selectedPart: ProductPart | null;
  selectedPhase: CircularPhase | null;
}

export function DppDrawer({
  isOpen,
  onClose,
  selectedNode,
  selectedPart,
  selectedPhase,
}: DppDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[380px] flex-col border-l border-border bg-card/95 backdrop-blur-md shadow-2xl transition-all duration-300 sm:max-w-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            {selectedNode
              ? "Tracciabilità Supply Chain"
              : selectedPart
              ? "Anatomia Materiali DPP"
              : "Economia Circolare"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Chiudi scheda informativa"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 text-sm">
        {/* === SCENARIO 1: SUPPLY CHAIN NODE === */}
        {selectedNode && (
          <div className="space-y-5">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {selectedNode.roleLabel}
              </span>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground">
                {selectedNode.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedNode.city}, {selectedNode.country}
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
              {selectedNode.description}
            </p>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-[11px] font-mono uppercase text-muted-foreground block">
                  Impronta CO₂
                </span>
                <span className="text-base font-bold text-foreground">
                  {selectedNode.co2}
                </span>
                <span className="mt-1 block text-[10px] text-emerald-600 dark:text-emerald-400">
                  -34% rispetto al benchmark
                </span>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-[11px] font-mono uppercase text-muted-foreground block">
                  Distanza Percorsa
                </span>
                <span className="text-base font-bold text-foreground">
                  {selectedNode.distance}
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {selectedNode.transportMode}
                </span>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <span className="text-xs font-mono uppercase text-muted-foreground block mb-2 font-semibold">
                Certificazioni Etiche & Ambientali
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.certifications.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground"
                  >
                    <svg className="h-3 w-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2.5">
              <span className="text-xs font-mono uppercase text-muted-foreground font-semibold block">
                Dettagli di Conformità ESPR
              </span>
              {selectedNode.highlights.map((h) => (
                <div key={h.label} className="flex justify-between items-start text-xs border-b border-border/40 pb-1.5 last:border-none last:pb-0">
                  <span className="text-muted-foreground">{h.label}</span>
                  <span className="font-medium text-foreground text-right ml-2">{h.value}</span>
                </div>
              ))}
            </div>

            {/* Blockchain / DPP Hash Verification */}
            <div className="rounded-lg border border-border bg-background p-3 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>ID LOTTO DPP</span>
                <span className="text-foreground font-semibold">{selectedNode.lotId}</span>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground truncate">
                <span>HASH LEDGER:</span>
                <span className="text-primary truncate ml-2">{selectedNode.verifiedDppHash}</span>
              </div>
            </div>
          </div>
        )}

        {/* === SCENARIO 2: EXPLODED PRODUCT PART === */}
        {selectedPart && (
          <div className="space-y-5">
            <div>
              <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {selectedPart.category}
              </span>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground">
                {selectedPart.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Peso stimato: {selectedPart.weight}
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
              {selectedPart.description}
            </p>

            {/* Circularity indicators */}
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Materiale Riciclato</span>
                  <span className="text-primary font-mono">{selectedPart.recycledPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${selectedPart.recycledPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Riciclabilità a Fine Vita</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">{selectedPart.recyclabilityRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${selectedPart.recyclabilityRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Material composition */}
            <div className="rounded-lg border border-border bg-background p-3 text-xs space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted-foreground block font-semibold">
                Composizione dei Materiali
              </span>
              <p className="text-foreground leading-normal">{selectedPart.materialComposition}</p>
            </div>

            {/* Disassembly & Repair */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-muted-foreground block font-semibold">
                Istruzioni Disassemblaggio & Riparabilità
              </span>
              <div className="flex items-center justify-between text-xs rounded-md bg-muted/50 p-2 border border-border">
                <span className="text-muted-foreground">Livello riparazione:</span>
                <span className="font-semibold text-foreground">{selectedPart.repairLevel}</span>
              </div>
              <div className="flex items-center justify-between text-xs rounded-md bg-muted/50 p-2 border border-border">
                <span className="text-muted-foreground">Tempo di smontaggio:</span>
                <span className="font-semibold text-primary font-mono">{selectedPart.disassemblyTime}</span>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground pt-1">
                {selectedPart.instructions.map((ins, idx) => (
                  <li key={idx} className="leading-normal">
                    <span className="text-foreground">{ins}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Regulations */}
            <div>
              <span className="text-xs font-mono uppercase text-muted-foreground block mb-2 font-semibold">
                Normative UE Correlate
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPart.dppDirectives.map((d) => (
                  <span
                    key={d}
                    className="inline-block rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-foreground font-mono"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === SCENARIO 3: CIRCULAR ECONOMY PHASE === */}
        {selectedPhase && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: selectedPhase.color }}
                >
                  {selectedPhase.phaseNumber}
                </span>
                <span className="text-xs font-mono uppercase font-semibold text-muted-foreground">
                  Fase {selectedPhase.phaseNumber} di 5
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground">
                {selectedPhase.name}
              </h3>
              <p className="text-xs text-primary font-medium mt-0.5">
                {selectedPhase.stage}
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
              {selectedPhase.description}
            </p>

            {/* KPIs */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono uppercase text-muted-foreground font-semibold block">
                Indicatori Chiave di Circolarità
              </span>
              <div className="grid grid-cols-1 gap-2">
                {selectedPhase.kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-2.5"
                  >
                    <div>
                      <span className="text-xs font-medium text-foreground block">{kpi.label}</span>
                      <span className="text-[11px] text-muted-foreground">{kpi.detail}</span>
                    </div>
                    <span
                      className="text-base font-bold font-mono ml-3"
                      style={{ color: selectedPhase.color }}
                    >
                      {kpi.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DPP Mandatory Data Points */}
            <div className="rounded-lg border border-border bg-background p-3.5 space-y-2">
              <span className="text-xs font-mono uppercase text-muted-foreground font-semibold block">
                Punti Dati Obbligatori nel Passaporto Digitale
              </span>
              <ul className="space-y-1.5 text-xs text-foreground">
                {selectedPhase.dppDataPoints.map((dp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{dp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* EU Standard */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
              <span className="text-[11px] font-mono uppercase text-muted-foreground block mb-1">
                Quadro Normativo UE
              </span>
              <p className="text-foreground leading-normal font-mono text-[11px]">{selectedPhase.esprStandard}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-border p-4 bg-muted/20">
        <a
          href="/progetta"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-95"
        >
          Progetta il DPP per il tuo prodotto →
        </a>
      </div>
    </div>
  );
}
