import "server-only";
import { matrixRows, visibleSteps, type WizardDef } from "@/lib/wizard/engine";
import type { Answers } from "@/lib/wizard/rules";

export type FormattedAnswer = { key: string; title: string; text: string; needsReview: boolean; hidden: boolean };

/** Risposte di un progetto in forma leggibile (etichette delle opzioni invece delle chiavi). */
export function formatAnswers(def: WizardDef, answers: Answers, review: Set<string> = new Set()): FormattedAnswer[] {
  const visible = new Set(visibleSteps(def, answers).map((s) => s.key));
  return def.steps
    .filter((s) => answers[s.key] !== undefined || visible.has(s.key))
    .map((s) => {
      const v = answers[s.key];
      let text = "—";
      if (Array.isArray(v)) text = v.map((k) => s.options.find((o) => o.key === k)?.label ?? k).join(", ") || "—";
      else if (typeof v === "string") text = s.options.find((o) => o.key === v)?.label ?? (v || "—");
      else if (typeof v === "number") text = String(v);
      else if (v && typeof v === "object" && s.type === "MATRIX")
        text =
          matrixRows(def, s, answers)
            .map((row) => {
              const cells = ((v as Record<string, string[]>)[row.key] ?? []).map((k) => s.options.find((o) => o.key === k)?.label ?? k);
              return `${row.label}: ${cells.join(", ") || "—"}`;
            })
            .join(" · ") || "—";
      else if (v && typeof v === "object")
        text = Object.entries(v)
          .filter(([, x]) => x !== "")
          .map(([k, x]) => {
            const label = s.config.fields?.find((f) => f.key === k)?.label.it ?? k;
            return `${label}: ${x}`;
          })
          .join(" · ");
      return { key: s.key, title: s.title, text, needsReview: review.has(s.key), hidden: !visible.has(s.key) };
    });
}
