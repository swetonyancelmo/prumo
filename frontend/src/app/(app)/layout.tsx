"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { ProfileProvider } from "@/components/profile-provider";
import { AppShell } from "@/components/app-shell";
import { Splash } from "@/components/splash";
import type { ReactNode } from "react";

type Status = "checking" | "ready" | "error";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<Status>("checking");

  // Sem sessão → login.
  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  // Com sessão → carrega perfil; 404 significa que ainda falta onboarding.
  useEffect(() => {
    if (loading || !session) return;
    let cancelled = false;

    (async () => {
      try {
        const me = await api.get<UserProfile>("/users/me");
        if (!cancelled) {
          setProfile(me);
          setStatus("ready");
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          router.replace("/onboarding");
        } else {
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, session, router]);

  if (loading || !session || status === "checking") {
    return <Splash />;
  }

  if (status === "error" || !profile) {
    return (
      <Splash label="Não foi possível carregar seu perfil. Recarregue a página." />
    );
  }

  return (
    <ProfileProvider value={profile}>
      <AppShell>{children}</AppShell>
    </ProfileProvider>
  );
}
