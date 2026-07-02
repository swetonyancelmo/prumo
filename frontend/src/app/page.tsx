import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  MessageCircleIcon,
  WalletIcon,
  CalendarCheckIcon,
  BarChart3Icon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { WhatsappDemo } from "@/components/landing/whatsapp-demo";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Ordenai — organize sua vida pelo WhatsApp",
  description:
    "Registre gastos, receitas e tarefas mandando uma mensagem no WhatsApp. A IA do Ordenai entende, organiza e te devolve tudo pronto — com painel web para relatórios.",
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
              Organização por WhatsApp
            </span>
            <h1 className="mt-5 text-balance font-heading text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              Sua vida organizada no ritmo de uma conversa.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Registre gastos, receitas e tarefas mandando uma mensagem. O
              Ordenai entende, organiza e te devolve tudo pronto — com um painel
              web para enxergar o mês inteiro.
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
                render={<Link href="#como-funciona" />}
              >
                Ver como funciona
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Sem planilha. Sem formulário. Só uma mensagem.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <WhatsappDemo />
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
              title="Três passos — e você nunca mais esquece um gasto"
            />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Step
                n={1}
                title="Mande uma mensagem"
                text="“Gastei 30 no mercado” ou “consulta médica quarta às 14h”. Do jeito que você fala."
              />
              <Step
                n={2}
                title="A IA entende"
                text="Ela extrai valor, categoria, data e tipo — despesa, receita ou tarefa. Nada de preencher campos."
              />
              <Step
                n={3}
                title="Confere e pronto"
                text="O Ordenai devolve o que entendeu para você confirmar. Errou? É só corrigir por mensagem."
              />
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
            <SectionTitle
              eyebrow="O que ele faz"
              title="Um assistente para o dinheiro e o dia a dia"
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Feature
                icon={WalletIcon}
                title="Finanças no automático"
                text="Despesas e receitas organizadas por categoria, com o saldo do mês sempre à mão."
              />
              <Feature
                icon={CalendarCheckIcon}
                title="Tarefas e agenda"
                text="Lembretes com vencimento e horário, tarefas recorrentes — compromissos e afazeres no mesmo lugar."
              />
              <Feature
                icon={BarChart3Icon}
                title="Relatórios claros"
                text="Veja para onde vai seu dinheiro no mês, por categoria, sem abrir planilha nenhuma."
              />
              <Feature
                icon={MessageCircleIcon}
                title="Tudo pelo WhatsApp"
                text="Onde você já conversa todo dia. Sem instalar mais um app, sem mais uma senha para lembrar."
              />
              <Feature
                icon={LayoutDashboardIcon}
                title="Painel web"
                text="Quando quiser o detalhe: edite lançamentos, filtre e enxergue a visão completa do mês."
              />
              <Feature
                icon={ShieldCheckIcon}
                title="Seus dados, suas regras"
                text="Pensado com a LGPD desde o início: exporte ou apague todos os seus dados quando quiser."
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
              Crie sua conta em segundos e mande a primeira mensagem. O resto o
              Ordenai faz por você.
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
          <p>Organização pessoal no ritmo de uma conversa.</p>
          <p>© {new Date().getFullYear()} Ordenai</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
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
