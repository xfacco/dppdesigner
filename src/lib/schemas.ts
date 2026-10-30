import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  company: z.string().trim().max(160).optional(),
  message: z.string().trim().min(5).max(4000),
  privacy: z.literal(true),
  // Campo trappola anti-bot: deve restare vuoto
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  password: z.string().min(10).max(128),
  company: z.string().trim().max(160).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  privacy: z.literal(true),
  marketing: z.boolean(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Versione dell'informativa privacy registrata insieme ai consensi. */
export const PRIVACY_POLICY_VERSION = "2026-10";
