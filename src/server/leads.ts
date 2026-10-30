import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type LeadFilters = { q?: string; status?: string; minScore?: string; marketing?: string };

/** Lead = utenti registrati (ruolo USER) con i loro progetti e consensi. */
export async function findLeads(f: LeadFilters) {
  const where: Prisma.UserWhereInput = { role: "USER" };
  if (f.q) {
    where.OR = [
      { email: { contains: f.q, mode: "insensitive" } },
      { name: { contains: f.q, mode: "insensitive" } },
      { company: { contains: f.q, mode: "insensitive" } },
    ];
  }
  if (f.status === "COMPLETED" || f.status === "IN_PROGRESS") where.journeys = { some: { status: f.status } };
  if (f.minScore && !Number.isNaN(Number(f.minScore))) {
    where.journeys = { some: { ...(where.journeys?.some ?? {}), score: { gte: Number(f.minScore) } } };
  }
  if (f.marketing === "yes") where.consents = { some: { type: "MARKETING", granted: true } };

  return db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      consents: { where: { type: "MARKETING" }, orderBy: { createdAt: "desc" }, take: 1 },
      journeys: {
        orderBy: { updatedAt: "desc" },
        include: { answers: { where: { stepKey: "industry" } } },
      },
    },
  });
}

export type Lead = Awaited<ReturnType<typeof findLeads>>[number];

export function leadSummary(lead: Lead) {
  const latest = lead.journeys[0];
  const best = lead.journeys.reduce<number | null>((m, j) => (j.score !== null && (m === null || j.score > m) ? j.score : m), null);
  const industry = latest?.answers[0]?.value;
  return {
    latest,
    bestScore: best,
    industry: typeof industry === "string" ? industry : Array.isArray(industry) ? industry.join(", ") : "",
    marketing: lead.consents[0]?.granted ?? false,
  };
}
