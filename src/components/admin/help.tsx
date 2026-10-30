import { cn } from "@/lib/utils";

/** Aiuto generale di pagina: riquadro apribile sotto il titolo. */
export function HelpPanel({
  title = "Come funziona questa pagina",
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("group mb-6 rounded-lg border border-primary/30 bg-accent/40", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-accent-foreground [&::-webkit-details-marker]:hidden">
        <HelpIcon />
        {title}
        <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Mostra</span>
        <span className="ml-auto hidden text-xs text-muted-foreground group-open:inline">Nascondi</span>
      </summary>
      <div className="help-content border-t border-primary/20 px-4 py-4 text-sm">{children}</div>
    </details>
  );
}

/** Aiuto di una singola sezione: link "Aiuto" che apre la spiegazione sotto il titolo. */
export function SectionHelp({ children, label = "Aiuto" }: { children: React.ReactNode; label?: string }) {
  return (
    <details className="group mb-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-primary hover:underline [&::-webkit-details-marker]:hidden">
        <HelpIcon small />
        <span className="group-open:hidden">{label}</span>
        <span className="hidden group-open:inline">Chiudi aiuto</span>
      </summary>
      <div className="help-content mt-2 rounded-md bg-muted/60 px-4 py-3 text-sm">{children}</div>
    </details>
  );
}

function HelpIcon({ small }: { small?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={small ? "h-3.5 w-3.5" : "h-4 w-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M7.8 7.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 1.9-2.2 3.2" strokeLinecap="round" />
      <circle cx="10" cy="14.4" r="0.4" fill="currentColor" />
    </svg>
  );
}
