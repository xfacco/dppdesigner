"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function LocaleSwitch({ to, label, className }: { to: string; label: string; className?: string }) {
  const pathname = usePathname();
  const href = `/api/locale?to=${to}&from=${encodeURIComponent(pathname)}`;
  return (
    <a href={href} hrefLang={to} className={cn("text-[13px] text-muted-foreground transition-colors hover:text-foreground", className)}>
      {label}
    </a>
  );
}
