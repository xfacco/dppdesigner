import { getTranslations } from "next-intl/server";

type Author = { name: string; title?: string | null; url?: string | null };

/**
 * Riga "Pubblicato il … · Aggiornato il … · di Nome, Ruolo" in testa ad articoli e pagine principali:
 * freschezza e autore visibili (E-E-A-T). La data di aggiornamento compare solo se diversa di almeno un giorno.
 */
export async function Byline({ locale, published, updated, author }: { locale: string; published?: Date; updated?: Date; author: Author | null }) {
  const t = await getTranslations("byline");
  const fmt = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(d);
  const showUpdated = updated && (!published || updated.getTime() - published.getTime() > 24 * 3600 * 1000);
  const parts: React.ReactNode[] = [];
  if (published) parts.push(<time key="p" dateTime={published.toISOString()}>{t("published", { date: fmt(published) })}</time>);
  if (showUpdated) parts.push(<time key="u" dateTime={updated.toISOString()}>{t("updated", { date: fmt(updated) })}</time>);
  if (author)
    parts.push(
      <span key="a">
        {t("by")}{" "}
        {author.url ? (
          <a href={author.url} rel="author noopener" target="_blank" className="font-medium text-foreground underline-offset-4 hover:underline">
            {author.name}
          </a>
        ) : (
          <span className="font-medium text-foreground">{author.name}</span>
        )}
        {author.title && <>, {author.title}</>}
      </span>,
    );
  if (!parts.length) return null;
  return (
    <p className="mt-5 text-sm text-muted-foreground">
      {parts.flatMap((p, i) => (i ? [<span key={`s${i}`} aria-hidden> · </span>, p] : [p]))}
    </p>
  );
}
