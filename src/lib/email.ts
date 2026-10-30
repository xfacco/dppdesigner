import "server-only";

type Email = { to: string; subject: string; text: string };

/** Email transazionali (verifica e reset password). Senza RESEND_API_KEY le stampa in console. */
export async function sendEmail({ to, subject, text }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[email] a: ${to}\n[email] oggetto: ${subject}\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Invio email fallito: ${res.status} ${await res.text()}`);
}
