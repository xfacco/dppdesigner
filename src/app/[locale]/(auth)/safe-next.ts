/** Accetta solo percorsi interni come destinazione dopo login/registrazione. */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Destinazione "inizia il wizard": dopo la registrazione si apre subito un nuovo progetto. */
export const WIZARD_START = "/progetta";
