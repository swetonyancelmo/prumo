"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Splash } from "@/components/splash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    // Pré-preenche o nome com o metadata do Supabase, se houver.
    const metaName = session.user.user_metadata?.name as string | undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (metaName) setName(metaName);

    // Já tem perfil? Segue direto.
    let cancelled = false;
    (async () => {
      try {
        await api.get<UserProfile>("/users/me");
        if (!cancelled) router.replace("/dashboard");
      } catch (e) {
        if (!cancelled && e instanceof ApiError && e.status === 404) {
          setChecking(false);
        } else if (!cancelled) {
          setChecking(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post<UserProfile>("/users", {
        name: name.trim() || undefined,
        email: session?.user.email ?? undefined,
      });
      toast.success("Tudo pronto! Bem-vindo ao Prumo.");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Não foi possível salvar.";
      toast.error(message);
      setSubmitting(false);
    }
  }

  if (loading || !session || checking) {
    return <Splash label="Preparando sua conta…" />;
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo markClassName="size-10" className="gap-2.5 [&_span]:text-2xl" />
          <p className="text-balance text-muted-foreground">
            Antes de começar: como você quer ser chamado?
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-[0_6px_24px_rgba(43,42,51,0.06)]">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Seu nome</FieldLabel>
                <Input
                  id="name"
                  placeholder="Como te chamamos?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
              </Field>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <ArrowRightIcon data-icon="inline-end" />
                )}
                Começar
              </Button>
            </FieldGroup>
          </form>
        </div>
      </div>
    </main>
  );
}
