import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  // Domini da cui si può accedere oltre a BETTER_AUTH_URL (es. dominio senza www, indirizzo run.app)
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    // L'utente registrato a fine wizard entra subito; la verifica email viene inviata comunque.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reimposta la password / Reset your password",
        text: `Per reimpostare la password apri questo link:\n${url}\n\nTo reset your password open this link:\n${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Conferma il tuo indirizzo email / Confirm your email",
        text: `Conferma il tuo indirizzo aprendo questo link:\n${url}\n\nConfirm your address by opening this link:\n${url}`,
      });
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "USER" },
      company: { type: "string", required: false },
      jobTitle: { type: "string", required: false },
      phone: { type: "string", required: false },
      locale: { type: "string", required: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // "Ultimo accesso" usato dal job di conservazione dati
        after: async (session) => {
          await db.user.update({ where: { id: session.userId }, data: { lastSeenAt: new Date() } });
        },
      },
    },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
