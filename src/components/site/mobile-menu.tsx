"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

/**
 * Menu ad hamburger per schermi stretti: il pulsante apre un pannello sotto l'header
 * con le voci passate come children. Si chiude con Esc, cambiando pagina o
 * toccando un link del pannello.
 */
export function MobileMenu({ labels, children }: { labels: { open: string; close: string }; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  // Chiude il pannello quando cambia pagina
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      <div
        id={panelId}
        hidden={!open}
        // Un clic su un link del pannello lo chiude (anche se la pagina non cambia)
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        className="absolute inset-x-0 top-full z-40 border-y bg-background shadow-lg"
      >
        <div className="mx-auto w-[min(calc(100%-40px),1200px)] py-4 sm:w-[min(calc(100%-80px),1200px)]">{children}</div>
      </div>
    </div>
  );
}
