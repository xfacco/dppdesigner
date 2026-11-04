"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Campo di ricerca degli articoli. È un form GET con il parametro "q": senza JavaScript funziona
 * con Invio; con JavaScript aggiorna i risultati mentre si scrive, senza aggiungere voci alla cronologia.
 */
export function ArticleSearch({ initial, label, placeholder, clear }: { initial: string; label: string; placeholder: string; clear: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const last = useRef(initial);

  const search = (q: string) => {
    last.current = q;
    startTransition(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }));
  };

  // Allinea il campo solo quando la ricerca cambia dall'esterno (es. link "Mostra tutti"), non mentre si scrive
  useEffect(() => {
    if (initial === last.current) return;
    setValue(initial);
    last.current = initial;
  }, [initial]);

  useEffect(() => {
    const q = value.trim();
    if (q === last.current) return;
    const timer = setTimeout(() => search(q), 250);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <form
      role="search"
      action={pathname}
      method="get"
      className="relative max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() !== last.current) search(value.trim());
      }}
    >
      <label htmlFor="article-search" className="sr-only">
        {label}
      </label>
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="M13 13l4 4" />
      </svg>
      <input
        id="article-search"
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        aria-busy={pending}
        className="h-12 w-full rounded-lg border bg-background pl-10 pr-11 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/25 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1.5 text-muted-foreground hover:text-foreground"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      )}
    </form>
  );
}
