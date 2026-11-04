import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { DiagramName } from "@/server/diagrams";

/**
 * Come si scaricano gli schemi: "files" = link ai file generati dal server (utente registrato,
 * proprietario del progetto); "locked" = invito a registrarsi o ad accedere.
 */
export type DownloadMode =
  | { kind: "files"; href: (diagram: DiagramName, format: "png" | "svg") => string }
  | { kind: "locked"; registerHref: string; loginHref: string };

export function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="9" width="12" height="8" rx="2" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" strokeLinecap="round" />
    </svg>
  );
}

/** Pulsanti di download di uno schema (SVG vettoriale o PNG ad alta risoluzione). */
export async function DiagramDownload({ diagram, mode }: { diagram: DiagramName; mode: DownloadMode }) {
  const t = await getTranslations("diagrams");
  if (mode.kind === "locked") {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <LockIcon />
        <span>{t("lockedHint")}</span>
        <Link href={mode.registerHref} className="font-medium text-primary underline-offset-4 hover:underline">
          {t("lockedRegister")}
        </Link>
        <span aria-hidden>·</span>
        <Link href={mode.loginHref} className="text-primary underline-offset-4 hover:underline">
          {t("lockedLogin")}
        </Link>
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <a href={mode.href(diagram, "png")} className={buttonVariants({ size: "sm", variant: "outline" })}>
        {t("downloadPng")}
      </a>
      <a href={mode.href(diagram, "svg")} className={buttonVariants({ size: "sm", variant: "outline" })}>
        {t("downloadSvg")}
      </a>
    </div>
  );
}
