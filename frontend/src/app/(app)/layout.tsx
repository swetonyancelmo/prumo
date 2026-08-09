"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ProfileProvider } from "@/components/profile-provider";
import { AppShell } from "@/components/app-shell";
import { Splash } from "@/components/splash";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  // O perfil vem junto da sessão (o AuthProvider carrega /users/me na
  // montagem), então aqui não há mais um segundo fetch nem o desvio para
  // /onboarding — o cadastro já cria o perfil completo.
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <Splash />;
  }

  return (
    <ProfileProvider value={user}>
      <AppShell>{children}</AppShell>
    </ProfileProvider>
  );
}
