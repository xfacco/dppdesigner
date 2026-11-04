import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { BlueprintSvg } from "@/components/diagrams/blueprint-svg";
import { DiagramSvg } from "@/components/diagrams/diagram-svg";
import type { DiagramName, Diagrams } from "./diagrams";

/**
 * File scaricabili degli schemi, generati sul server (così si possono riservare agli utenti
 * registrati): SVG vettoriale e PNG ad alta risoluzione, con il font Inter incluso nel progetto
 * (assets/fonts) perché sul server non ci sono font di sistema.
 */

const FONT_DIR = path.join(process.cwd(), "assets/fonts");
export const FONT_FILES = {
  regular: path.join(FONT_DIR, "Inter-Regular.ttf"),
  medium: path.join(FONT_DIR, "Inter-Medium.ttf"),
  semibold: path.join(FONT_DIR, "Inter-SemiBold.ttf"),
  bold: path.join(FONT_DIR, "Inter-Bold.ttf"),
};

export type SvgFile = { svg: string; width: number; height: number; title: string };

/** Markup statico di un componente: import dinamico perché Next.js non vuole react-dom/server tra i moduli del server. */
async function staticMarkup(node: React.ReactElement) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(node);
}

/** SVG autonomo di uno schema, con larghezza e altezza esplicite (come lo scaricava il browser). */
export async function diagramSvg(d: Diagrams, name: DiagramName): Promise<SvgFile> {
  const markup = await staticMarkup(
    name === "blueprint" ? (
      <BlueprintSvg blueprint={d.blueprint} svgId="diagram-blueprint" labels={d.labels} />
    ) : (
      <DiagramSvg diagram={d.flow} svgId="diagram-flow" />
    ),
  );
  const [, , width, height] = (markup.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 1000 600").split(" ").map(Number);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n${markup.replace('width="100%"', `width="${width}" height="${height}"`)}`;
  return { svg, width, height, title: name === "blueprint" ? d.blueprint.title : d.flow.title };
}

/** PNG da un SVG, su sfondo bianco; scale 2 = doppia risoluzione. */
export function svgToPng(svg: string, scale = 2): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: scale },
    background: "#FFFFFF",
    font: {
      fontFiles: Object.values(FONT_FILES),
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
      sansSerifFamily: "Inter",
    },
  });
  return resvg.render().asPng();
}

let logo: Buffer | null = null;
/** Logo del sito (public/logo.svg) in PNG, per il report PDF. */
export function logoPng(): Buffer {
  logo ??= svgToPng(readFileSync(path.join(process.cwd(), "public/logo.svg"), "utf8"), 4);
  return logo;
}
