import type { Metadata } from "next";
import { THEME_SCRIPT } from "@/components/site/theme-toggle";
import { inter } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin — DPP Designer", template: "%s — Admin DPP Designer" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-muted/40">{children}</body>
    </html>
  );
}
