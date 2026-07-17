"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  WalletIcon,
  ListChecksIcon,
  BarChart3Icon,
  LogOutIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useProfile } from "@/components/profile-provider";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "Início", icon: HomeIcon },
  { href: "/financas", label: "Finanças", icon: WalletIcon },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3Icon },
  { href: "/tarefas", label: "Tarefas", icon: ListChecksIcon },
] as const;

function useInitials() {
  const profile = useProfile();
  return (profile.name ?? profile.email ?? "PR").slice(0, 2).toUpperCase();
}

function useSignOut() {
  const { signOut } = useAuth();
  const router = useRouter();
  return async () => {
    await signOut();
    router.replace("/login");
  };
}

/** Navegação vertical da sidebar (desktop). */
function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
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

/** Tab bar fixa no rodapé (mobile). */
function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-sidebar/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("size-5", active && "fill-primary/10")} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Rodapé de perfil da sidebar (desktop): avatar, nome, tema e sair. */
function DesktopUserFooter() {
  const profile = useProfile();
  const initials = useInitials();
  const signOut = useSignOut();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{profile.name ?? "Você"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {profile.email ?? ""}
        </p>
      </div>
      <ThemeToggle />
      <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
        <LogOutIcon />
      </Button>
    </div>
  );
}

/** Menu de conta (mobile): avatar abre nome/telefone + sair. */
function MobileAccountMenu() {
  const profile = useProfile();
  const initials = useInitials();
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label="Sua conta"
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="truncate text-sm font-medium">
              {profile.name ?? "Você"}
            </p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {profile.email ?? ""}
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={signOut}>
            <LogOutIcon />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
            Prumo
          </span>
        </Link>
        <div className="flex-1">
          <DesktopNav />
        </div>
        <DesktopUserFooter />
      </aside>

      {/* Top bar — mobile */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-sidebar/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoMark className="size-7" />
          <span className="font-heading text-base font-semibold tracking-tight">
            Prumo
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <MobileAccountMenu />
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      {/* Tab bar — mobile */}
      <BottomNav />
    </div>
  );
}
