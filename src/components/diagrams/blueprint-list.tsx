import type { Blueprint, BpStatus } from "@/lib/diagrams/blueprint";
import { cn } from "@/lib/utils";

const DOT: Record<BpStatus, string> = {
  defined: "bg-[#4D7C0F]",
  open: "bg-[#D97706]",
  attention: "bg-[#DC2626]",
  na: "bg-[#94A3B8]",
};
const CARD: Record<BpStatus, string> = {
  defined: "border-border",
  open: "border-dashed border-[#D97706] bg-[#FFFBEB]",
  attention: "border-[#DC2626] bg-[#FEF2F2]",
  na: "border-dashed border-border text-muted-foreground",
};

/**
 * Versione HTML del Blueprint: su telefono sostituisce il disegno (aree impilate),
 * su desktop è la descrizione testuale accessibile.
 */
export function BlueprintList({
  blueprint: bp,
  hrefFor,
  labels,
}: {
  blueprint: Blueprint;
  hrefFor: (stepKey: string) => string;
  labels: { legend: Record<BpStatus, string>; category: string; statusName: Record<BpStatus, string> };
}) {
  const statuses: BpStatus[] = ["defined", "open", "attention", "na"];
  return (
    <div className="grid gap-5 text-sm">
      <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label={labels.legend.defined}>
        {statuses.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", DOT[s])} />
            {bp.counts[s]} {labels.legend[s]}
          </li>
        ))}
      </ul>

      {bp.sections.map((s, i) => (
        <section key={s.key} aria-labelledby={`bp-${s.key}`} className="grid gap-2">
          <h3 id={`bp-${s.key}`} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {i + 1}. {s.title}
          </h3>
          <ul className="grid gap-2">
            {s.cards.map((c) => {
              const body = (
                <>
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">{c.title}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs">
                      <span aria-hidden className={cn("h-2 w-2 rounded-full", DOT[c.status])} />
                      {labels.statusName[c.status]}
                    </span>
                  </span>
                  <span className="mt-0.5 block font-medium">{c.value}</span>
                </>
              );
              return (
                <li key={c.stepKey}>
                  {c.status === "na" ? (
                    <div className={cn("block rounded-md border px-3 py-2", CARD[c.status])}>{body}</div>
                  ) : (
                    <a href={hrefFor(c.stepKey)} className={cn("block rounded-md border px-3 py-2 hover:bg-muted", CARD[c.status])}>
                      {body}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          {s.table && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border bg-muted/50 px-2 py-1.5 text-left font-semibold uppercase">{labels.category}</th>
                    {s.table.columns.map((c) => (
                      <th key={c.stepKey} className="border bg-muted/50 px-2 py-1.5 text-left font-semibold uppercase">
                        <a href={hrefFor(c.stepKey)} className="hover:underline">
                          {c.title}
                        </a>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((r) => (
                    <tr key={r.key}>
                      <th scope="row" className="border px-2 py-1.5 text-left font-semibold">
                        {r.label}
                      </th>
                      {r.cells.map((cell, ci) => (
                        <td key={ci} className={cn("border px-2 py-1.5", cell.status !== "defined" && CARD[cell.status])}>
                          <span className="sr-only">{labels.statusName[cell.status]}: </span>
                          {cell.value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      {bp.notes.length > 0 && (
        <ul className="grid gap-1.5">
          {bp.notes.map((n, i) => (
            <li key={i} className="flex gap-2">
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.tone === "attention" ? "bg-[#DC2626]" : n.tone === "open" ? "bg-[#D97706]" : "bg-[#2F80D1]",
                )}
              />
              {n.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
