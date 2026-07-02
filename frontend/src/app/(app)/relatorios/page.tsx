"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
} from "recharts";
import type { Report, ReportPeriod } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { CategoryTab } from "@/components/category-tab";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "quarter", label: "Trimestre" },
  { value: "semester", label: "Semestre" },
  { value: "year", label: "Ano" },
];

const CHART_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const barConfig = {
  incomes: { label: "Receitas", color: "var(--success)" },
  expenses: { label: "Despesas", color: "var(--destructive)" },
} satisfies ChartConfig;

const balanceConfig = {
  saldo: { label: "Saldo acumulado", color: "var(--primary)" },
} satisfies ChartConfig;

function shiftAnchor(cur: Date, period: ReportPeriod, dir: 1 | -1): Date {
  if (period === "week") {
    return new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7 * dir);
  }
  const months =
    period === "month" ? 1 : period === "quarter" ? 3 : period === "semester" ? 6 : 12;
  return new Date(cur.getFullYear(), cur.getMonth() + months * dir, 1);
}

// Envia a âncora como meio-dia local (sem Z) para não escorregar de fuso no backend.
function anchorParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return encodeURIComponent(`${y}-${m}-${day}T12:00:00`);
}

function pctDelta(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return (cur - prev) / prev;
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  const path = `/reports?period=${period}&anchor=${anchorParam(anchor)}`;
  const { data: report, loading, error } = useResource<Report>(path);

  const hasData =
    !!report && (report.totals.incomes > 0 || report.totals.expenses > 0);

  // Rosca: top 5 categorias + "Outros".
  const pie = useMemo(() => {
    if (!report) return { data: [], config: {} as ChartConfig };
    const top = report.byCategory.slice(0, 5).map((c, i) => ({
      name: c.name,
      total: c.total,
      color: CHART_VARS[i],
    }));
    const rest = report.byCategory.slice(5);
    if (rest.length) {
      top.push({
        name: "Outros",
        total: rest.reduce((s, c) => s + c.total, 0),
        color: "var(--muted-foreground)",
      });
    }
    const config: ChartConfig = {};
    top.forEach((d) => (config[d.name] = { label: d.name, color: d.color }));
    return { data: top, config };
  }, [report]);

  // Linha: saldo acumulado ao longo dos sub-períodos.
  const balanceSeries = useMemo(() => {
    if (!report) return [];
    let running = 0;
    return report.series.map((p) => {
      running += p.incomes - p.expenses;
      return { label: p.label, saldo: running };
    });
  }, [report]);

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Para onde vai — e de onde vem — o seu dinheiro"
      />

      {/* Controles: período + navegação */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          value={[period]}
          onValueChange={(vals) => {
            const next = vals[vals.length - 1] as ReportPeriod | undefined;
            if (next) setPeriod(next);
          }}
          variant="outline"
          className="flex-wrap"
        >
          {PERIODS.map((p) => (
            <ToggleGroupItem key={p.value} value={p.value}>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnchor((a) => shiftAnchor(a, period, -1))}
            aria-label="Período anterior"
          >
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium">
            {report?.range.label ?? "…"}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnchor((a) => shiftAnchor(a, period, 1))}
            aria-label="Próximo período"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Kpi
              label="Receitas"
              value={report?.totals.incomes}
              delta={
                report ? pctDelta(report.totals.incomes, report.previous.incomes) : null
              }
              goodWhen="up"
              loading={loading}
            />
            <Kpi
              label="Despesas"
              value={report?.totals.expenses}
              delta={
                report ? pctDelta(report.totals.expenses, report.previous.expenses) : null
              }
              goodWhen="down"
              loading={loading}
            />
            <Kpi
              label="Saldo"
              value={report?.totals.balance}
              delta={
                report ? pctDelta(report.totals.balance, report.previous.balance) : null
              }
              goodWhen="up"
              loading={loading}
              emphasize
            />
          </div>

          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : !hasData ? (
            <Card>
              <CardContent className="py-4">
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BarChart3Icon />
                    </EmptyMedia>
                    <EmptyTitle>Sem lançamentos neste período</EmptyTitle>
                    <EmptyDescription>
                      Registre despesas e receitas para ver seus relatórios aqui.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            report && (
              <div className="flex flex-col gap-6">
                {/* Receita x Despesa no tempo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Receitas × Despesas</CardTitle>
                    <CardDescription>Ao longo de {report.range.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={barConfig} className="h-64 w-full">
                      <BarChart data={report.series} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => (
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    {barConfig[name as keyof typeof barConfig]?.label}
                                  </span>
                                  <span className="font-medium tabular-nums">
                                    {formatBRL(value as number)}
                                  </span>
                                </div>
                              )}
                            />
                          }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                          dataKey="incomes"
                          fill="var(--color-incomes)"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          fill="var(--color-expenses)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Gastos por categoria (rosca) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Gastos por categoria</CardTitle>
                      <CardDescription>Onde o dinheiro está indo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {report.byCategory.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                          Sem despesas no período.
                        </p>
                      ) : (
                        <ChartContainer
                          config={pie.config}
                          className="mx-auto aspect-square max-h-64"
                        >
                          <PieChart>
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  nameKey="name"
                                  formatter={(value) => (
                                    <span className="font-medium tabular-nums">
                                      {formatBRL(value as number)}
                                    </span>
                                  )}
                                />
                              }
                            />
                            <Pie
                              data={pie.data}
                              dataKey="total"
                              nameKey="name"
                              innerRadius={55}
                              strokeWidth={2}
                            >
                              {pie.data.map((d) => (
                                <Cell key={d.name} fill={d.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tendência de saldo */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tendência de saldo</CardTitle>
                      <CardDescription>Saldo acumulado no período</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={balanceConfig} className="h-64 w-full">
                        <LineChart data={balanceSeries} accessibilityLayer>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                formatter={(value) => (
                                  <span className="font-medium tabular-nums">
                                    {formatBRL(value as number)}
                                  </span>
                                )}
                              />
                            }
                          />
                          <Line
                            dataKey="saldo"
                            type="monotone"
                            stroke="var(--color-saldo)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela de categorias (relief de acessibilidade da rosca) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhe por categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col divide-y">
                      {report.byCategory.map((c) => {
                        const delta = pctDelta(c.total, c.previousTotal);
                        return (
                          <li key={c.name} className="flex items-center gap-3 py-2.5">
                            <CategoryTab colorKey={c.name} className="h-6" />
                            <span className="flex-1 truncate text-sm font-medium">
                              {c.name}
                            </span>
                            <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                              {Math.round(c.share * 100)}%
                            </span>
                            <DeltaBadge delta={delta} goodWhen="down" />
                            <span className="w-24 text-right text-sm font-semibold tabular-nums">
                              {formatBRL(c.total)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </>
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  delta,
  goodWhen,
  loading,
  emphasize,
}: {
  label: string;
  value: number | undefined;
  delta: number | null;
  goodWhen: "up" | "down";
  loading: boolean;
  emphasize?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading || value === undefined ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p
            className={cn(
              "font-heading text-2xl font-semibold tabular-nums tracking-tight md:text-3xl",
              emphasize && value >= 0 && "text-success",
              emphasize && value < 0 && "text-destructive",
            )}
          >
            {formatBRL(value)}
          </p>
        )}
        <DeltaBadge delta={delta} goodWhen={goodWhen} showLabel />
      </CardContent>
    </Card>
  );
}

function DeltaBadge({
  delta,
  goodWhen,
  showLabel,
}: {
  delta: number | null;
  goodWhen: "up" | "down";
  showLabel?: boolean;
}) {
  if (delta === null || !isFinite(delta)) {
    return showLabel ? (
      <span className="text-xs text-muted-foreground">sem base anterior</span>
    ) : (
      <span className="w-16" />
    );
  }
  const up = delta > 0;
  const good = goodWhen === "up" ? delta >= 0 : delta <= 0;
  const Icon = up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        good ? "text-success" : "text-destructive",
        !showLabel && "w-16 justify-end",
      )}
    >
      <Icon className="size-3.5" />
      {up ? "+" : ""}
      {Math.round(delta * 100)}%
      {showLabel && (
        <span className="text-muted-foreground">vs. anterior</span>
      )}
    </span>
  );
}
