import type { Diagram, Icon } from "@/lib/diagrams/generate";
import { FONT, LAYOUT, layoutDiagram, type PlacedItem } from "@/lib/diagrams/layout";

/**
 * Disegno SVG di uno schema. I colori sono valori fissi (non variabili CSS) perché lo
 * stesso SVG viene scaricato e deve restare leggibile fuori dal sito, su fondo bianco.
 */

const C = {
  text: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
  itemStroke: "#CBD5E1",
  warnStroke: "#D97706",
  warnFill: "#FFFBEB",
  bg: "#FFFFFF",
};

const COLUMN = {
  slate: { header: "#E8EDF3", headerText: "#1E293B", border: "#CBD5E1", body: "#F8FAFC" },
  sky: { header: "#DCEBFA", headerText: "#1D4F86", border: "#2F80D1", body: "#FFFFFF" },
  green: { header: "#7FAF34", headerText: "#FFFFFF", border: "#7FAF34", body: "#FFFFFF" },
  navy: { header: "#1F2A3C", headerText: "#FFFFFF", border: "#1F2A3C", body: "#FFFFFF" },
  amber: { header: "#F6D58A", headerText: "#6B4A00", border: "#E3A93B", body: "#FFFFFF" },
} as const;

const EDGE = { default: "#475569", dotted: "#2F80D1", accent: "#E07B00", warning: "#D97706" } as const;

const ICONS: Record<Icon, { label: string; fill: string; color: string }> = {
  excel: { label: "XLS", fill: "#E7F4EC", color: "#1D6F42" },
  pdf: { label: "PDF", fill: "#FDECEC", color: "#C53030" },
  api: { label: "API", fill: "#EEF2F7", color: "#334155" },
  system: { label: "SYS", fill: "#EEF2F7", color: "#334155" },
  manual: { label: "UI", fill: "#FFF4E5", color: "#B45309" },
  more: { label: "+", fill: "#F1F5F9", color: "#94A3B8" },
  product: { label: "PRD", fill: "#EEF2F7", color: "#334155" },
  qr: { label: "QR", fill: "#FFF7E0", color: "#8A6100" },
  registry: { label: "EU", fill: "#E5E9F0", color: "#1F2A3C" },
  cloud: { label: "DPP", fill: "#EEF6E2", color: "#4D7C0F" },
};

function ItemBox({ it }: { it: PlacedItem }) {
  const warn = it.tone === "warning";
  const muted = it.tone === "muted";
  const { LH, ICON } = LAYOUT;
  let y = it.y + 12;
  const tx = it.x + 12;

  const title = it.titleLines.map((l, i) => {
    y += LH.itemTitle;
    return (
      <text key={`t${i}`} x={tx} y={y - 4} fontSize={FONT.itemTitle} fontWeight={700} fill={muted ? C.faint : C.text}>
        {l}
      </text>
    );
  });
  if (it.subtitleLines.length) y += 2;
  const subtitle = it.subtitleLines.map((l, i) => {
    y += LH.small;
    return (
      <text key={`s${i}`} x={tx} y={y - 4} fontSize={FONT.small} fill={muted ? C.faint : C.muted}>
        {l}
      </text>
    );
  });
  if (it.bodyLines.length) y += 8;
  const body = it.bodyLines.map((l, i) => {
    y += LH.small;
    return (
      <text key={`b${i}`} x={tx} y={y - 4} fontSize={FONT.small} fill={C.text}>
        {l}
      </text>
    );
  });
  if (it.bulletLines.length) y += 8;
  const bullets = it.bulletLines.map((lines, bi) => {
    const startY = y;
    const out = lines.map((l, i) => {
      y += LH.small;
      return (
        <text key={`u${bi}-${i}`} x={tx + 14} y={y - 4} fontSize={FONT.small} fill={C.text}>
          {l}
        </text>
      );
    });
    y += 4;
    return (
      <g key={`g${bi}`}>
        <circle cx={tx + 4} cy={startY + LH.small / 2 + 2} r={2.2} fill={C.muted} />
        {out}
      </g>
    );
  });

  const icon = it.icon ? ICONS[it.icon] : null;
  return (
    <g>
      <rect
        x={it.x}
        y={it.y}
        width={it.w}
        height={it.h}
        rx={8}
        fill={warn ? C.warnFill : C.bg}
        stroke={warn ? C.warnStroke : C.itemStroke}
        strokeWidth={1.2}
        strokeDasharray={it.dashed ? "5 4" : undefined}
      />
      {icon && (
        <g>
          <rect x={it.x + it.w - ICON - 10} y={it.y + 10} width={ICON} height={ICON} rx={6} fill={icon.fill} />
          <text
            x={it.x + it.w - ICON / 2 - 10}
            y={it.y + 10 + ICON / 2 + 4}
            fontSize={10}
            fontWeight={700}
            textAnchor="middle"
            fill={icon.color}
          >
            {icon.label}
          </text>
        </g>
      )}
      {title}
      {subtitle}
      {body}
      {bullets}
    </g>
  );
}

export function DiagramSvg({ diagram, svgId }: { diagram: Diagram; svgId: string }) {
  const L = layoutDiagram(diagram);
  const titleId = `${svgId}-title`;
  const descId = `${svgId}-desc`;
  const markers = Object.entries(EDGE);

  return (
    <svg
      id={svgId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${L.width} ${L.height}`}
      width="100%"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    >
      <title id={titleId}>{diagram.title}</title>
      <desc id={descId}>{diagram.subtitle}</desc>
      <defs>
        {markers.map(([name, color]) => (
          <marker key={name} id={`${svgId}-arrow-${name}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={color} />
          </marker>
        ))}
      </defs>
      <rect width={L.width} height={L.height} fill={C.bg} />

      {L.titleLines.map((l, i) => (
        <text key={i} x={LAYOUT.PAD} y={46 + i * 30} fontSize={FONT.title} fontWeight={800} fill={C.text}>
          {l}
        </text>
      ))}
      {L.subtitleLines.map((l, i) => (
        <text key={i} x={LAYOUT.PAD} y={46 + (L.titleLines.length - 1) * 30 + 26 + i * 18} fontSize={FONT.subtitle} fill={C.muted}>
          {l}
        </text>
      ))}

      {L.columns.map((col, i) => {
        const s = COLUMN[col.color];
        const headerY = L.bodyTop - LAYOUT.HEADER_H;
        return (
          <g key={col.id}>
            <rect x={col.x} y={headerY} width={col.w} height={L.bodyBottom - headerY} rx={10} fill={s.body} stroke={s.border} strokeWidth={1.4} />
            <path
              d={`M ${col.x} ${headerY + 10} Q ${col.x} ${headerY} ${col.x + 10} ${headerY} H ${col.x + col.w - 10} Q ${col.x + col.w} ${headerY} ${col.x + col.w} ${headerY + 10} V ${L.bodyTop} H ${col.x} Z`}
              fill={s.header}
            />
            <text
              x={col.x + col.w / 2}
              y={headerY + LAYOUT.HEADER_H / 2 + 5}
              textAnchor="middle"
              fontSize={FONT.header}
              fontWeight={800}
              fill={s.headerText}
              letterSpacing="0.04em"
            >
              {`${i + 1}. ${col.title.toUpperCase()}`}
            </text>
          </g>
        );
      })}

      {L.columns.flatMap((col) => col.items.map((it) => <ItemBox key={it.id} it={it} />))}

      {L.edges.map((e, i) => {
        const tone = e.tone && e.tone !== "default" ? e.tone : e.style === "dotted" ? "dotted" : "default";
        const color = EDGE[tone];
        return (
          <path
            key={`e${i}`}
            d={e.path}
            fill="none"
            stroke={color}
            strokeWidth={e.style === "dotted" ? 2.2 : 2}
            strokeLinecap="round"
            strokeDasharray={e.style === "dotted" ? "1 7" : e.style === "dashed" ? "7 6" : undefined}
            markerEnd={`url(#${svgId}-arrow-${tone})`}
          />
        );
      })}

      {L.edges
        .filter((e) => e.label)
        .map((e, i) => {
          const w = Math.min(260, e.label!.length * 6.4 + 22);
          const accent = e.tone === "accent";
          return (
            <g key={`l${i}`}>
              <rect
                x={e.labelX - w / 2}
                y={e.labelY - 11}
                width={w}
                height={22}
                rx={11}
                fill={accent ? "#FFF1D6" : "#FEF3C7"}
                stroke={accent ? EDGE.accent : EDGE.warning}
              />
              <text x={e.labelX} y={e.labelY + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={accent ? "#9A4A00" : "#92400E"}>
                {e.label}
              </text>
            </g>
          );
        })}

      {L.notes.map((n, i) => (
        <g key={`n${i}`}>
          <text x={LAYOUT.PAD} y={n.y} fontSize={FONT.small} fontWeight={700} fill={EDGE.warning}>
            !
          </text>
          {n.lines.map((l, j) => (
            <text key={j} x={LAYOUT.PAD + 14} y={n.y + j * LAYOUT.LH.small} fontSize={FONT.small} fill={C.muted}>
              {l}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}
