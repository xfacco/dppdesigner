"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignOutButton({ label, redirectTo, className }: { label: string; redirectTo: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={cn("text-sm text-muted-foreground hover:text-foreground cursor-pointer", className)}
      onClick={async () => {
        await authClient.signOut();
        router.push(redirectTo);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
