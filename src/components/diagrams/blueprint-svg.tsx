import type { Blueprint, BpCell, BpStatus } from "@/lib/diagrams/blueprint";
import { wrap } from "@/lib/diagrams/layout";

/**
 * Disegno SVG del Blueprint del DPP: aree in colonna con le schede degli step,
 * tabella per categoria nell'area Prodotto, contatori e note. Colori fissi (non
 * variabili CSS) perché lo stesso SVG viene scaricato.
 */

const W = 1200;
const PAD = 24;
const GAP = 28;
const HEADER_H = 40;
const BODY_PAD = 12;
const CARD_GAP = 10;

const C = { text: "#0F172A", muted: "#64748B", faint: "#94A3B8", line: "#CBD5E1", bg: "#FFFFFF" };

export const STATUS_STYLE: Record<BpStatus, { stroke: string; fill: string; icon: string; iconFill: string; dash?: string }> = {
  defined: { stroke: "#CBD5E1", fill: "#FFFFFF", icon: "✓", iconFill: "#4D7C0F" },
  open: { stroke: "#D97706", fill: "#FFFBEB", icon: "?", iconFill: "#D97706", dash: "5 4" },
  attention: { stroke: "#DC2626", fill: "#FEF2F2", icon: "!", iconFill: "#DC2626" },
  na: { stroke: "#E2E8F0", fill: "#F8FAFC", icon: "–", iconFill: "#94A3B8", dash: "3 4" },
};

const SECTION_COLORS: Record<string, { header: string; text: string; border: string }> = {
  company: { header: "#E8EDF3", text: "#1E293B", border: "#CBD5E1" },
  product: { header: "#F6D58A", text: "#6B4A00", border: "#E3A93B" },
  data: { header: "#DCEBFA", text: "#1D4F86", border: "#2F80D1" },
  identification: { header: "#FDE2CF", text: "#9A3412", border: "#EA8A4E" },
  infrastructure: { header: "#7FAF34", text: "#FFFFFF", border: "#7FAF34" },
};
const OTHER_COLOR = { header: "#E5E7EB", text: "#374151", border: "#D1D5DB" };

function StatusIcon({ x, y, status }: { x: number; y: number; status: BpStatus }) {
  const s = STATUS_STYLE[status];
  if (status === "defined") {
    return (
      <g>
        <circle cx={x} cy={y} r={8} fill={s.iconFill} />
        <path d={`M ${x - 3.5} ${y} L ${x - 1} ${y + 2.8} L ${x + 3.8} ${y - 2.8}`} stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={x} cy={y} r={8} fill={s.iconFill} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#FFFFFF">
        {s.icon}
      </text>
    </g>
  );
}

type Labels = { legend: Record<BpStatus, string>; category: string };

export function BlueprintSvg({
  blueprint: bp,
  svgId,
  hrefFor,
  labels,
}: {
  blueprint: Blueprint;
  svgId: string;
  /** Link allo step per modificare la risposta (solo nella pagina) */
  hrefFor?: (stepKey: string) => string;
  labels: Labels;
}) {
  // ── Intestazione
  const titleLines = wrap(bp.title, W - 2 * PAD, 26);
  const subtitleY = 46 + (titleLines.length - 1) * 30 + 26;
  const legendY = subtitleY + 30;
  const colTop = legendY + 26;
  const bodyTop = colTop + HEADER_H;

  // ── Colonne: l'area con la tabella è larga il doppio
  const weights = bp.sections.map((s) => (s.table ? 2.4 : 1));
  const unit = (W - 2 * PAD - GAP * (bp.sections.length - 1)) / weights.reduce((a, b) => a + b, 0);
  let cursor = PAD;
  const cols = bp.sections.map((s, i) => {
    const w = unit * weights[i];
    const x = cursor;
    cursor += w + GAP;
    let y = bodyTop + BODY_PAD;
    const innerW = w - 2 * BODY_PAD;

    const cards = s.cards.map((c) => {
      // Maiuscolo con spaziatura: stima prudente della larghezza (come un 13px normale)
      const titleL = wrap(c.title.toUpperCase(), innerW - 40, 12.5);
      const valueL = wrap(c.value, innerW - 20, 13);
      const h = Math.max(52, 10 + titleL.length * 13 + 5 + valueL.length * 17 + 10);
      const placed = { ...c, x: x + BODY_PAD, y, w: innerW, h, titleL, valueL };
      y += h + CARD_GAP;
      return placed;
    });

    let table = null as null | {
      y: number;
      colX: number[];
      colW: number[];
      header: { lines: string[] }[];
      headerH: number;
      rows: { label: string[]; cells: (BpCell & { lines: string[] })[]; h: number }[];
      h: number;
    };
    if (s.table) {
      const n = s.table.columns.length;
      const firstW = innerW * 0.3;
      const otherW = (innerW - firstW) / Math.max(1, n);
      const colW = [firstW, ...Array(n).fill(otherW)];
      const colX = colW.map((_, ci) => x + BODY_PAD + colW.slice(0, ci).reduce((a, b) => a + b, 0));
      // Intestazioni in minuscolo: le parole lunghe (es. "Manutenzione") non vengono spezzate
      const header = [labels.category, ...s.table.columns.map((c) => c.title)].map((t, ci) => ({ lines: wrap(t, colW[ci] - 8, 11) }));
      const headerH = Math.max(...header.map((h) => h.lines.length)) * 13 + 14;
      const rows = s.table.rows.map((r) => {
        const label = wrap(r.label, colW[0] - 12, 12);
        const cells = r.cells.map((c, ci) => ({ ...c, lines: wrap(c.value, colW[ci + 1] - 12, 12) }));
        const lines = Math.max(label.length, ...cells.map((c) => c.lines.length));
        return { label, cells, h: lines * 15 + 14 };
      });
      const h = headerH + rows.reduce((a, r) => a + r.h, 0);
      table = { y: y + 4, colX, colW, header, headerH, rows, h };
      y += h + 8;
    }
    return { section: s, x, w, cards, table, bottom: y };
  });

  const bodyBottom = Math.max(...cols.map((c) => c.bottom), bodyTop + 80) + BODY_PAD - CARD_GAP;
  let noteY = bodyBottom + 34;
  const notes = bp.notes.map((n) => {
    const lines = wrap(n.text, W - 2 * PAD - 24, 12);
    const placed = { ...n, y: noteY, lines };
    noteY += lines.length * 16 + 8;
    return placed;
  });
  const H = (notes.length ? noteY : bodyBottom) + 20;

  const legendItems: BpStatus[] = ["defined", "open", "attention", "na"];
  let lx = PAD;

  return (
    <svg
      id={svgId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-labelledby={`${svgId}-title ${svgId}-desc`}
      fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    >
      <title id={`${svgId}-title`}>{bp.title}</title>
      <desc id={`${svgId}-desc`}>{bp.subtitle}</desc>
      <rect width={W} height={H} fill={C.bg} />

      {titleLines.map((l, i) => (
        <text key={i} x={PAD} y={46 + i * 30} fontSize={26} fontWeight={800} fill={C.text}>
          {l}
        </text>
      ))}
      <text x={PAD} y={subtitleY} fontSize={14} fill={C.muted}>
        {bp.subtitle}
      </text>

      {/* Contatori */}
      {legendItems.map((st) => {
        const text = `${bp.counts[st]} ${labels.legend[st]}`;
        const x = lx;
        lx += 30 + text.length * 7;
        return (
          <g key={st}>
            <StatusIcon x={x + 8} y={legendY - 4} status={st} />
            <text x={x + 22} y={legendY} fontSize={13} fontWeight={600} fill={C.text}>
              {text}
            </text>
          </g>
        );
      })}

      {cols.map((col, i) => {
        const color = SECTION_COLORS[col.section.key] ?? OTHER_COLOR;
        const headerY = colTop;
        return (
          <g key={col.section.key}>
            <rect x={col.x} y={headerY} width={col.w} height={bodyBottom - headerY} rx={10} fill="#FFFFFF" stroke={color.border} strokeWidth={1.4} />
            <path
              d={`M ${col.x} ${headerY + 10} Q ${col.x} ${headerY} ${col.x + 10} ${headerY} H ${col.x + col.w - 10} Q ${col.x + col.w} ${headerY} ${col.x + col.w} ${headerY + 10} V ${headerY + HEADER_H} H ${col.x} Z`}
              fill={color.header}
            />
            <text x={col.x + col.w / 2} y={headerY + HEADER_H / 2 + 5} textAnchor="middle" fontSize={12.5} fontWeight={800} fill={color.text} letterSpacing="0.04em">
              {`${i + 1}. ${col.section.title.toUpperCase()}`}
            </text>
            {/* Freccia verso l'area successiva */}
            {i < cols.length - 1 && (
              <path
                d={`M ${col.x + col.w + 8} ${headerY + HEADER_H / 2 - 6} L ${col.x + col.w + GAP - 8} ${headerY + HEADER_H / 2} L ${col.x + col.w + 8} ${headerY + HEADER_H / 2 + 6}`}
                fill="none"
                stroke={C.faint}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {col.cards.map((c) => {
              const s = STATUS_STYLE[c.status];
              const content = (
                <g>
                  <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={7} fill={s.fill} stroke={s.stroke} strokeWidth={1.2} strokeDasharray={s.dash} />
                  <StatusIcon x={c.x + c.w - 14} y={c.y + 14} status={c.status} />
                  {c.titleL.map((l, li) => (
                    <text key={`t${li}`} x={c.x + 10} y={c.y + 20 + li * 13} fontSize={9.5} fontWeight={700} fill={C.muted} letterSpacing="0.02em">
                      {l}
                    </text>
                  ))}
                  {c.valueL.map((l, li) => (
                    <text
                      key={`v${li}`}
                      x={c.x + 10}
                      y={c.y + 20 + c.titleL.length * 13 + 5 + li * 17}
                      fontSize={13}
                      fontWeight={c.status === "na" ? 400 : 600}
                      fill={c.status === "na" ? C.faint : C.text}
                    >
                      {l}
                    </text>
                  ))}
                </g>
              );
              return hrefFor && c.status !== "na" ? (
                <a key={c.stepKey} href={hrefFor(c.stepKey)}>
                  {content}
                </a>
              ) : (
                <g key={c.stepKey}>{content}</g>
              );
            })}

            {col.table && (
              <g>
                {col.table.header.map((h, ci) => (
                  <g key={`h${ci}`}>
                    <rect x={col.table!.colX[ci]} y={col.table!.y} width={col.table!.colW[ci]} height={col.table!.headerH} fill="#F8FAFC" stroke={C.line} strokeWidth={0.8} />
                    {h.lines.map((l, li) => (
                      <text key={li} x={col.table!.colX[ci] + 5} y={col.table!.y + 17 + li * 13} fontSize={10.5} fontWeight={700} fill={C.muted}>
                        {l}
                      </text>
                    ))}
                  </g>
                ))}
                {(() => {
                  let ry = col.table!.y + col.table!.headerH;
                  return col.table!.rows.map((r, ri) => {
                    const y = ry;
                    ry += r.h;
                    return (
                      <g key={`r${ri}`}>
                        <rect x={col.table!.colX[0]} y={y} width={col.table!.colW[0]} height={r.h} fill="#FFFFFF" stroke={C.line} strokeWidth={0.8} />
                        {r.label.map((l, li) => (
                          <text key={li} x={col.table!.colX[0] + 6} y={y + 18 + li * 15} fontSize={12} fontWeight={700} fill={C.text}>
                            {l}
                          </text>
                        ))}
                        {r.cells.map((cell, ci) => {
                          const s = STATUS_STYLE[cell.status];
                          const cx = col.table!.colX[ci + 1];
                          const cw = col.table!.colW[ci + 1];
                          return (
                            <g key={ci}>
                              <rect x={cx} y={y} width={cw} height={r.h} fill={cell.status === "defined" ? "#FFFFFF" : s.fill} stroke={C.line} strokeWidth={0.8} />
                              {cell.status !== "defined" && <rect x={cx + 1} y={y + 1} width={3} height={r.h - 2} fill={s.iconFill} />}
                              {cell.lines.map((l, li) => (
                                <text key={li} x={cx + 8} y={y + 18 + li * 15} fontSize={12} fill={cell.status === "na" ? C.faint : C.text}>
                                  {l}
                                </text>
                              ))}
                            </g>
                          );
                        })}
                      </g>
                    );
                  });
                })()}
              </g>
            )}
          </g>
        );
      })}

      {notes.map((n, i) => {
        const color = n.tone === "attention" ? "#DC2626" : n.tone === "open" ? "#D97706" : "#2F80D1";
        return (
          <g key={`n${i}`}>
            <circle cx={PAD + 5} cy={n.y - 4} r={4} fill={color} />
            {n.lines.map((l, j) => (
              <text key={j} x={PAD + 16} y={n.y + j * 16} fontSize={12} fill={C.text}>
                {l}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
