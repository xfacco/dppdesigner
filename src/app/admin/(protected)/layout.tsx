import Link from "next/link";
import { LogoMark } from "@/components/site/logo";
import { SignOutButton } from "@/components/site/sign-out-button";
import { requireStaff, roleOf } from "@/lib/session";

const NAV = [
  { href: "/admin", label: "Panoramica" },
  { href: "/admin/leads", label: "Lead" },
  { href: "/admin/journeys", label: "Progetti" },
  { href: "/admin/questions", label: "Domande" },
  { href: "/admin/wizard", label: "Wizard" },
  { href: "/admin/content", label: "Contenuti" },
  { href: "/admin/posts", label: "Articoli" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/messages", label: "Messaggi" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  const isAdmin = roleOf(session) === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b bg-background md:w-56 md:border-b-0 md:border-r">
        <div className="px-4 py-5">
          <Link href="/admin" className="inline-flex items-center gap-2" aria-label="DPP Designer — Admin">
            <LogoMark className="h-6 w-6" />
            <span className="text-[17px] font-semibold tracking-[-0.05em]">
              DPP<span className="font-normal text-muted-foreground"> Admin</span>
            </span>
          </Link>
        </div>
        <nav className="flex flex-wrap gap-1 px-2 pb-4 md:flex-col">
          {[...NAV, ...(isAdmin ? [{ href: "/admin/users", label: "Utenti" }] : [])].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t px-4 py-4 text-xs text-muted-foreground md:block">
          <p className="truncate">{session.user.email}</p>
          <SignOutButton label="Esci" redirectTo="/admin/login" className="mt-2 text-xs" />
          <Link href="/it" className="mt-2 block hover:text-foreground">
            Vai al sito →
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
