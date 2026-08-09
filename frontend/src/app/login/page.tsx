"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Já autenticado? Segue para o painel.
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        // O cadastro já cria o perfil e devolve a sessão — não há passo de
        // onboarding depois.
        await signUp(email, password, name.trim() || undefined);
      } else {
        await signIn(email, password);
      }
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Não foi possível conectar. Verifique sua internet e tente de novo.";
      toast.error(message);
      setSubmitting(false);
    }
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
            Seu dia organizado, do jeito que você anota.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-[0_6px_24px_rgba(43,42,51,0.06)]">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {mode === "signup" && (
                <Field>
                  <FieldLabel htmlFor="name">Seu nome</FieldLabel>
                  <Input
                    id="name"
                    autoComplete="name"
                    placeholder="Como te chamamos?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                />
                {mode === "signup" && (
                  <FieldDescription>Mínimo de 8 caracteres.</FieldDescription>
                )}
              </Field>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <ArrowRightIcon data-icon="inline-end" />
                )}
                {mode === "signup" ? "Criar conta" : "Entrar"}
              </Button>
            </FieldGroup>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() =>
              setMode((m) => (m === "signup" ? "signin" : "signup"))
            }
          >
            {mode === "signup" ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </div>
    </main>
  );
}
