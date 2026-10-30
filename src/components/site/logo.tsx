import { cn } from "@/lib/utils";

/**
 * Simbolo di DPP Designer: cornice del passaporto / data carrier, marcatore in alto
 * a sinistra (come nei QR code), tre righe di dati e un punto verde (dato verificato,
 * sostenibilità). Usa currentColor per adattarsi al tema; il punto usa il colore d'accento.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7 shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="7" y="7" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="16" y="8.25" width="9" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="7" y="15" width="18" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="7" y="21.25" width="10" height="2.5" rx="1.25" fill="currentColor" />
      <circle cx="22.5" cy="22.5" r="3" fill="var(--color-primary, #257345)" />
    </svg>
  );
}

/** Logo completo: simbolo + nome. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[23px] font-semibold leading-none tracking-[-0.06em]">
        DPP<span className="font-normal text-muted-foreground"> Designer</span>
      </span>
    </span>
  );
}
