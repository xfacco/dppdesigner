import { NextResponse, type NextRequest } from "next/server";
import { getSession, roleOf } from "@/lib/session";
import { findLeads, leadSummary } from "@/server/leads";

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  // Prefisso contro la formula injection nei fogli di calcolo
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const role = roleOf(await getSession());
  if (role !== "ADMIN" && role !== "EDITOR") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const leads = await findLeads({
    q: p.get("q") ?? undefined,
    status: p.get("status") ?? undefined,
    minScore: p.get("minScore") ?? undefined,
    marketing: p.get("marketing") ?? undefined,
  });

  const header = ["nome", "email", "azienda", "ruolo", "telefono", "industry", "progetti", "punteggio_migliore", "stato_ultimo", "consenso_marketing", "registrato"];
  const rows = leads.map((l) => {
    const s = leadSummary(l);
    return [l.name, l.email, l.company, l.jobTitle, l.phone, s.industry, l.journeys.length, s.bestScore, s.latest?.status, s.marketing ? "si" : "no", l.createdAt.toISOString()];
  });
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lead-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
