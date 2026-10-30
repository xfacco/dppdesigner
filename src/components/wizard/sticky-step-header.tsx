"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Intestazione dello step (barra di avanzamento + titolo) che resta fissa in alto
 * quando raggiunge il bordo della finestra. Uno "stuck" rilevato con IntersectionObserver
 * su un elemento sentinella aggiunge sfondo bianco, bordo e titolo compatto; tornando su
 * l'intestazione riprende l'aspetto iniziale.
 * Espone l'altezza in --step-header-h, usata dalla colonna dei riferimenti per non finirci sotto.
 */
export function StickyStepHeader({ children }: { children: React.ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = header.current;
    if (!el) return;
    const update = () => document.documentElement.style.setProperty("--step-header-h", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--step-header-h");
    };
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden className="h-px" />
      <div
        ref={header}
        data-stuck={stuck || undefined}
        className={cn(
          "group/sticky sticky top-0 z-20 -mt-px py-3 transition-[background-color,box-shadow] duration-200",
          // Quando è fissa: sfondo bianco e linea inferiore estesi a tutta la larghezza della finestra
          stuck &&
            "bg-card shadow-[0_0_0_100vmax_var(--color-card)] [clip-path:inset(0_-100vmax_-1px)] after:absolute after:inset-x-[-100vmax] after:bottom-0 after:h-px after:bg-border",
        )}
      >
        {children}
      </div>
    </>
  );
}
