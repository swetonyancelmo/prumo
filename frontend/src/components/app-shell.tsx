"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HomeIcon, WalletIcon, ListChecksIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useProfile } from "@/components/profile-provider";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "Início", icon: HomeIcon },
  { href: "/financas", label: "Finanças", icon: WalletIcon },
  { href: "/tarefas", label: "Tarefas", icon: ListChecksIcon },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 md:flex-col">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors md:flex-none",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter() {
  const profile = useProfile();
  const { signOut } = useAuth();
  const router = useRouter();
  const initials = (profile.name ?? profile.phoneNumber)
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {profile.name ?? "Você"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {profile.phoneNumber}
        </p>
      </div>
      <ThemeToggle />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        aria-label="Sair"
      >
        <LogOutIcon />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 md:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
          <LogoMark />
          <span className="font-heading text-lg font-semibold tracking-tight">
            Ordenai
          </span>
        </Link>
        <div className="flex-1">
          <NavLinks />
        </div>
        <UserFooter />
      </aside>

      {/* Top bar — mobile */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-sidebar px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoMark className="size-7" />
          <span className="font-heading text-base font-semibold">Ordenai</span>
        </Link>
        <UserFooter />
      </header>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Nav — mobile (abaixo do topo) */}
        <div className="border-b bg-sidebar px-3 py-2 md:hidden">
          <NavLinks />
        </div>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
