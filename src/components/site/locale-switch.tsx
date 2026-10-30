"use client";

import { usePathname } from "next/navigation";

export function LocaleSwitch({ to, label }: { to: string; label: string }) {
  const pathname = usePathname();
  const href = `/api/locale?to=${to}&from=${encodeURIComponent(pathname)}`;
  return (
    <a href={href} hrefLang={to} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
      {label}
    </a>
  );
}
