import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { headingId } from "@/lib/blog";
import { cn } from "@/lib/utils";

/** Testo semplice di un nodo React (per ricavare l'ancora di un titolo). */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/**
 * Markdown dei contenuti gestiti da admin. L'HTML grezzo non viene interpretato.
 * Con `headingIds` i titoli ## hanno un'ancora (per l'indice dell'articolo e i link diretti).
 */
export function Markdown({ children, className, headingIds }: { children: string; className?: string; headingIds?: boolean }) {
  return (
    <div className={cn("prose-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // I link esterni (es. EUR-Lex) si aprono in una nuova scheda
          a: ({ href, children }) =>
            href && /^https?:\/\//.test(href) ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <a href={href}>{children}</a>
            ),
          ...(headingIds
            ? { h2: ({ children }) => <h2 id={headingId(textOf(Children.toArray(children)))}>{children}</h2> }
            : {}),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
