"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function svgSource(svgId: string): { text: string; width: number; height: number } | null {
  const svg = document.getElementById(svgId) as SVGSVGElement | null;
  if (!svg) return null;
  const [, , width, height] = (svg.getAttribute("viewBox") ?? "0 0 1000 600").split(" ").map(Number);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  return { text: new XMLSerializer().serializeToString(clone), width, height };
}

/** Scarica lo schema come SVG (vettoriale) o PNG (immagine ad alta risoluzione). */
export function DiagramDownload({ svgId, fileName }: { svgId: string; fileName: string }) {
  const t = useTranslations("diagrams");
  const [busy, setBusy] = useState(false);

  const downloadSvg = () => {
    const src = svgSource(svgId);
    if (src) save(new Blob([src.text], { type: "image/svg+xml" }), `${fileName}.svg`);
  };

  const downloadPng = async () => {
    const src = svgSource(svgId);
    if (!src) return;
    setBusy(true);
    try {
      const scale = 2;
      const img = new Image();
      const url = URL.createObjectURL(new Blob([src.text], { type: "image/svg+xml" }));
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = src.width * scale;
      canvas.height = src.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => blob && save(blob, `${fileName}.png`), "image/png");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={downloadPng} disabled={busy}>
        {t("downloadPng")}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={downloadSvg}>
        {t("downloadSvg")}
      </Button>
    </div>
  );
}
