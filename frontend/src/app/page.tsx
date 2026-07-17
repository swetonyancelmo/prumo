import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  WalletIcon,
  CalendarCheckIcon,
  BarChart3Icon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  TagIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "Prumo — suas finanças e tarefas, organizadas" },
  description:
    "Um painel web tranquilo para registrar despesas, receitas e tarefas, organizar por categoria e acompanhar o mês com relatórios claros. Sem planilha, sem complicação.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <SparklesIcon className="size-3.5" />
              Organização pessoal
            </span>
            <h1 className="mt-5 text-balance font-heading text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              Suas finanças e tarefas, no mesmo lugar.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              O Prumo é um painel web tranquilo para registrar gastos, receitas
              e tarefas, organizar por categoria e enxergar o mês inteiro — com
              relatórios que fazem sentido.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Criar conta grátis
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                nativeButton={false}
                render={<Link href="#recursos" />}
              >
                Ver recursos
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Grátis para começar. Seus dados são só seus.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <PanelPreview />
          </div>
        </section>

        {/* Como funciona */}
        <section
          id="como-funciona"
          className="border-y bg-card/40 py-16 md:py-20"
        >
          <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
            <SectionTitle
              eyebrow="Como funciona"
              title="Três passos — e o mês para de ser um mistério"
            />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Step
                n={1}
                title="Registre"
                text="Lançou um gasto, recebeu um valor, lembrou de uma tarefa? Um formulário rápido e pronto."
              />
              <Step
                n={2}
                title="Organize"
                text="Categorias para o dinheiro, vencimento e horário para as tarefas. Cada coisa no seu lugar."
              />
              <Step
                n={3}
                title="Acompanhe"
                text="O painel soma tudo e os relatórios mostram para onde o dinheiro foi — semana, mês ou ano."
              />
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
            <SectionTitle
              eyebrow="O que ele faz"
              title="Simples para o dia a dia, completo quando você precisa"
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Feature
                icon={WalletIcon}
                title="Finanças organizadas"
                text="Despesas e receitas por categoria, com o saldo do mês sempre à mão."
              />
              <Feature
                icon={CalendarCheckIcon}
                title="Tarefas e agenda"
                text="Lembretes com vencimento e horário, tarefas recorrentes — afazeres e compromissos juntos."
              />
              <Feature
                icon={BarChart3Icon}
                title="Relatórios claros"
                text="Semana, mês, trimestre ou ano: veja a evolução e a variação por categoria, sem planilha."
              />
              <Feature
                icon={TagIcon}
                title="Categorias do seu jeito"
                text="Crie as categorias que fazem sentido para você, na hora de lançar. Nada de listas engessadas."
              />
              <Feature
                icon={LayoutDashboardIcon}
                title="Painel que respira"
                text="Um dashboard limpo, no claro ou no escuro, que mostra o essencial sem te afogar em números."
              />
              <Feature
                icon={ShieldCheckIcon}
                title="Seus dados, suas regras"
                text="Pensado com a LGPD desde o início: apague todos os seus dados quando quiser, sem burocracia."
              />
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 pb-20 md:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground">
            <h2 className="max-w-xl text-balance font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Comece a se organizar hoje
            </h2>
            <p className="max-w-md text-primary-foreground/80">
              Crie sua conta em segundos e faça o primeiro lançamento. Leva menos
              tempo do que procurar a planilha.
            </p>
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Criar conta grátis
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row md:px-8">
          <Logo className="[&_span]:text-base" markClassName="size-6" />
          <p>Suas finanças e tarefas, organizadas.</p>
          <p>© {new Date().getFullYear()} Prumo</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Prévia estática do painel — mostra o elemento-assinatura do produto: a "aba
 * de categoria" (retângulo colorido na borda esquerda de cada item).
 */
function PanelPreview() {
  return (
    <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-[0_12px_40px_rgba(43,42,51,0.10)]">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-muted-foreground">Este mês</p>
        <p className="font-heading text-2xl font-semibold tabular-nums">
          R$ 2.480
        </p>
      </div>
      <div className="mt-4 space-y-2.5">
        <PreviewRow tab="bg-rose-400" title="Mercado" meta="Alimentação · hoje" value="− R$ 132,90" />
        <PreviewRow tab="bg-emerald-400" title="Salário" meta="Receita · 05/07" value="+ R$ 4.200,00" />
        <PreviewRow tab="bg-sky-400" title="Consulta médica" meta="Amanhã · 14h" value="" task />
        <PreviewRow tab="bg-amber-400" title="Conta de luz" meta="Vence sexta" value="− R$ 189,00" />
      </div>
    </div>
  );
}

function PreviewRow({
  tab,
  title,
  meta,
  value,
  task = false,
}: {
  tab: string;
  title: string;
  meta: string;
  value: string;
  task?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2.5">
      <span className={`h-8 w-1.5 shrink-0 rounded-full ${tab}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      {task ? (
        <span className="size-4 shrink-0 rounded-md border-2 border-muted-foreground/40" />
      ) : (
        <p className="shrink-0 text-sm font-medium tabular-nums">{value}</p>
      )}
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-balance font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-heading text-lg font-semibold text-primary">
        {n}
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-muted-foreground">{text}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40">
      <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
