import type { Diagram, DiagramColumn, DiagramEdge, DiagramItem } from "./generate";

/**
 * Calcolo delle posizioni di uno schema (coordinate SVG). Le dimensioni del testo sono
 * stimate per andare a capo senza misurare nel browser: lo schema si genera sul server
 * ed è identico nel file scaricato.
 */

export const W = 1080;
const PAD = 24;
const GAP = 48;
/** Spazio tra due colonne collegate da una freccia con etichetta, per non coprire i riquadri */
const GAP_LABEL = 116;
const COL_TOP = 104;
const HEADER_H = 40;
const BODY_PAD = 14;
const ITEM_GAP = 12;
const OFFSET_TOP = 64; // spazio per le frecce che saltano una colonna
const ICON = 32;

export const FONT = {
  title: 26,
  subtitle: 14,
  header: 13,
  itemTitle: 14,
  small: 12,
};
const LH = { itemTitle: 18, small: 16 };

/** Va a capo per parole stimando la larghezza dei caratteri. */
export function wrap(text: string, width: number, fontSize: number): string[] {
  const max = Math.max(8, Math.floor(width / (fontSize * 0.55)));
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if ((line + " " + word).length <= max) line += " " + word;
    else {
      out.push(line);
      line = word;
    }
    while (line.length > max) {
      out.push(line.slice(0, max - 1) + "-");
      line = line.slice(max - 1);
    }
  }
  if (line) out.push(line);
  return out;
}

export type PlacedItem = DiagramItem & {
  x: number;
  y: number;
  w: number;
  h: number;
  titleLines: string[];
  subtitleLines: string[];
  bodyLines: string[];
  bulletLines: string[][];
};

export type PlacedColumn = Omit<DiagramColumn, "items"> & { x: number; w: number; items: PlacedItem[] };
export type PlacedEdge = DiagramEdge & { path: string; labelX: number; labelY: number };

export type Layout = {
  width: number;
  height: number;
  columns: PlacedColumn[];
  edges: PlacedEdge[];
  bodyTop: number;
  bodyBottom: number;
  titleLines: string[];
  subtitleLines: string[];
  notes: { y: number; lines: string[] }[];
};

function placeItem(item: DiagramItem, x: number, y: number, w: number): PlacedItem {
  const textW = w - 24 - (item.icon ? ICON + 10 : 0);
  const titleLines = wrap(item.title, textW, FONT.itemTitle);
  const subtitleLines = item.subtitle ? wrap(item.subtitle, textW, FONT.small) : [];
  const bodyLines = (item.lines ?? []).flatMap((l) => wrap(l, w - 24, FONT.small));
  const bulletLines = (item.bullets ?? []).map((b) => wrap(b, w - 24 - 14, FONT.small));

  let h = 12 + titleLines.length * LH.itemTitle;
  if (subtitleLines.length) h += 2 + subtitleLines.length * LH.small;
  if (bodyLines.length) h += 8 + bodyLines.length * LH.small;
  if (bulletLines.length) h += 8 + bulletLines.reduce((s, b) => s + b.length * LH.small + 4, 0);
  h = Math.max(h + 12, item.icon ? ICON + 24 : 52);
  return { ...item, x, y, w, h, titleLines, subtitleLines, bodyLines, bulletLines };
}

export function layoutDiagram(d: Diagram): Layout {
  const n = d.columns.length;
  // Colonna di ogni riquadro, per sapere quali spazi tra colonne ospitano un'etichetta
  const colOf = new Map(d.columns.flatMap((c, i) => c.items.map((it) => [it.id, i] as const)));
  const gaps = d.columns.slice(1).map((_, i) =>
    d.edges.some((e) => e.label && colOf.get(e.from) === i && colOf.get(e.to) === i + 1) ? GAP_LABEL : GAP,
  );
  const colW = (W - 2 * PAD - gaps.reduce((s, g) => s + g, 0)) / n;
  const colX = d.columns.map((_, i) => PAD + i * colW + gaps.slice(0, i).reduce((s, g) => s + g, 0));
  const titleLines = wrap(d.title, W - 2 * PAD, FONT.title);
  const subtitleLines = wrap(d.subtitle, W - 2 * PAD, FONT.subtitle);
  const top = COL_TOP + (titleLines.length - 1) * 30 + (subtitleLines.length - 1) * 18;
  const bodyTop = top + HEADER_H;

  const columns: PlacedColumn[] = d.columns.map((c, i) => {
    const x = colX[i];
    let y = bodyTop + BODY_PAD + (c.offsetTop ? OFFSET_TOP : 0);
    const items = c.items.map((it) => {
      const placed = placeItem(it, x + BODY_PAD, y, colW - 2 * BODY_PAD);
      y += placed.h + ITEM_GAP;
      return placed;
    });
    return { ...c, x, w: colW, items };
  });

  const contentBottom = Math.max(...columns.map((c) => (c.items.at(-1) ? c.items.at(-1)!.y + c.items.at(-1)!.h : bodyTop + 60)));
  const bodyBottom = contentBottom + BODY_PAD;

  const items = new Map(columns.flatMap((c, ci) => c.items.map((it) => [it.id, { it, ci }] as const)));
  const laneY = bodyTop + OFFSET_TOP / 2;

  const edges: PlacedEdge[] = d.edges.flatMap((e) => {
    const a = items.get(e.from);
    const b = items.get(e.to);
    if (!a || !b) return [];
    const sx = a.it.x + a.it.w;
    const sy = a.it.y + Math.min(a.it.h / 2, 40);
    const tx = b.it.x;
    // Più frecce verso lo stesso riquadro arrivano sulla sua parte alta
    const ty = b.it.y + Math.min(b.it.h / 2, 48);
    if (b.ci - a.ci > 1) {
      // Salta una colonna: passa nella fascia libera in alto
      const x1 = sx + BODY_PAD + gaps[a.ci] / 2;
      const x2 = tx - BODY_PAD - gaps[b.ci - 1] / 2;
      const r = 10;
      const path = [
        `M ${sx} ${sy}`,
        `H ${x1 - r}`,
        `Q ${x1} ${sy} ${x1} ${sy - r}`,
        `V ${laneY + r}`,
        `Q ${x1} ${laneY} ${x1 + r} ${laneY}`,
        `H ${x2 - r}`,
        `Q ${x2} ${laneY} ${x2} ${laneY + r}`,
        `V ${ty - r}`,
        `Q ${x2} ${ty} ${x2 + r} ${ty}`,
        `H ${tx - 2}`,
      ].join(" ");
      return [{ ...e, path, labelX: (x1 + x2) / 2, labelY: laneY }];
    }
    const mx = (sx + tx) / 2;
    const path = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx - 2} ${ty}`;
    return [{ ...e, path, labelX: mx, labelY: (sy + ty) / 2 }];
  });

  let y = bodyBottom + 34;
  const notes = d.notes.map((note) => {
    const lines = wrap(note, W - 2 * PAD - 24, FONT.small);
    const placed = { y, lines };
    y += lines.length * LH.small + 8;
    return placed;
  });

  return {
    width: W,
    height: (notes.length ? y : bodyBottom) + 20,
    columns,
    edges,
    bodyTop,
    bodyBottom,
    titleLines,
    subtitleLines,
    notes,
  };
}

export const LAYOUT = { PAD, HEADER_H, ICON, LH };
