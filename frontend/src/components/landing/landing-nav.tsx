"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  const { session, loading } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" aria-label="Prumo — início">
          <Logo />
        </Link>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {!loading && session ? (
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              Ir para o painel
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/login" />}
                className="max-sm:hidden"
              >
                Entrar
              </Button>
              <Button nativeButton={false} render={<Link href="/login" />}>
                Criar conta
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
