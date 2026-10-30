import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { translatePath } from "@/server/content";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") ?? routing.defaultLocale;
  const from = req.nextUrl.searchParams.get("from") ?? "/";
  const locale = routing.locales.includes(to as never) ? to : routing.defaultLocale;
  // Solo percorsi interni
  const safeFrom = from.startsWith("/") && !from.startsWith("//") ? from : "/";

  const target = await translatePath(safeFrom, locale);
  const res = NextResponse.redirect(new URL(target, req.url));
  res.cookies.set("NEXT_LOCALE", locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
