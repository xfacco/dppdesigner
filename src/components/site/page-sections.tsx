import { splitMarkdown } from "@/lib/markdown-sections";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

/** Larghezza massima del sito, con margini laterali minimi di 20px (telefono) e 40px. */
export const RAIL = "mx-auto w-[min(calc(100%-40px),1200px)] sm:w-[min(calc(100%-80px),1200px)]";

/** Riga di sezione: titolo a sinistra, contenuto a destra, separata da una linea. */
export function SectionRow({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section
      id={id}
      className="grid gap-5 border-t py-8 md:grid-cols-[minmax(190px,0.8fr)_minmax(0,1.2fr)] md:gap-[30px] md:py-10"
      aria-label={title}
    >
      <h2 className="m-0 text-xl font-normal leading-snug tracking-[-0.025em]">{title}</h2>
      <div className="min-w-0 max-w-[640px]">{children}</div>
    </section>
  );
}

/** Contenuto di una pagina Markdown nello stile del sito: introduzione e sezioni a due colonne. */
export function MarkdownBody({ body, className }: { body: string; className?: string }) {
  const { intro, sections } = splitMarkdown(body);
  return (
    <div className={cn("grid", className)}>
      {intro && (
        <div className="max-w-[720px] pb-8">
          <Markdown>{intro}</Markdown>
        </div>
      )}
      {sections.map((s, i) => (
        <SectionRow key={i} title={s.title}>
          <Markdown className="[&>*:last-child]:mb-0">{s.body}</Markdown>
        </SectionRow>
      ))}
    </div>
  );
}

/** Etichetta piccola in monospace, come le didascalie del sito di riferimento. */
export function MonoLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("m-0 font-mono text-[11px] leading-normal tracking-[0.025em] text-muted-foreground", className)}>{children}</p>;
}
