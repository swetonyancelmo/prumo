/**
 * Relatório financeiro em PDF.
 *
 * Desenhado com @react-pdf/renderer (vetorial, texto selecionável) em vez de
 * "print screen" da tela: um PDF de imagem fica borrado ao imprimir e pesa
 * muito mais. Por isso os gráficos são redesenhados aqui — não dá para
 * reaproveitar os SVGs do Recharts, que dependem de CSS variables inexistentes
 * fora do navegador.
 *
 * Sempre no tema CLARO: PDF é lido no branco, não em dark mode.
 *
 * A fonte é a Helvetica embutida no PDF. As do produto (Bricolage/Figtree) vêm
 * via next/font e não têm URL estável para registrar aqui — a marca fica por
 * conta do logo, da paleta e do layout.
 */
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Polyline,
  Line,
  Font,
} from "@react-pdf/renderer";
import type { Report } from "./types";
import { categoryColorHex, formatBRL } from "./format";

// Desliga a hifenização: sem isso, um nome de categoria que não coubesse na
// coluna sairia partido ao meio ("Alimenta-ção"). Preferimos deixar a palavra
// inteira quebrar para a linha de baixo.
Font.registerHyphenationCallback((word) => [word]);

// Espelham o :root do globals.css (tema claro).
const COLOR = {
  ink: "#2b2a33",
  muted: "#78748a",
  border: "#e4e2ec",
  mist: "#f3f2f7",
  primary: "#6c5ce0",
  success: "#2fa98c",
  destructive: "#f2765c",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 44,
    paddingHorizontal: 38,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLOR.ink,
    backgroundColor: COLOR.white,
  },

  // --- Cabeçalho ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLOR.primary,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Tile branco arredondado — o PNG da marca tem fundo branco sólido (ver
  // CLAUDE.md > Logo), então ele é sempre exibido sobre um tile.
  logoTile: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLOR.white,
    borderWidth: 1,
    borderColor: COLOR.border,
    padding: 3,
  },
  logo: { width: "100%", height: "100%", objectFit: "contain" },
  brandName: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: COLOR.primary,
    letterSpacing: -0.3,
  },
  headerRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  docMeta: { fontSize: 8, color: COLOR.muted, marginTop: 2 },

  // --- Faixa do período ---
  periodBand: {
    marginTop: 10,
    backgroundColor: COLOR.mist,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  periodLabel: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  periodRange: { fontSize: 8, color: COLOR.muted },

  // --- KPIs ---
  kpiRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 8,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 8,
    color: COLOR.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kpiValue: { fontSize: 15, fontFamily: "Helvetica-Bold", marginTop: 5 },
  kpiDelta: { fontSize: 7.5, marginTop: 3 },

  // --- Seções ---
  // As medidas daqui para baixo são apertadas de propósito: um mês típico
  // (KPIs + dois gráficos + ~8 categorias) tem de fechar em UMA página A4.
  // Períodos maiores paginam normalmente — cabeçalho, rodapé e o cabeçalho da
  // tabela são `fixed` e se repetem.
  section: { marginTop: 13 },
  sectionTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  sectionSub: { fontSize: 8, color: COLOR.muted, marginTop: 2 },

  // --- Gráfico de barras ---
  chartBox: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 8,
    padding: 10,
  },
  bars: { flexDirection: "row", alignItems: "flex-end", height: 78, gap: 4 },
  barGroup: { flex: 1, alignItems: "center" },
  barPair: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
    height: 64,
  },
  barLabel: {
    fontSize: 6.5,
    color: COLOR.muted,
    marginTop: 4,
    textAlign: "center",
  },
  legend: { flexDirection: "row", gap: 14, marginTop: 7 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendSwatch: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 7.5, color: COLOR.muted },

  // --- Tabela de categorias ---
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 8,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: COLOR.mist,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  th: { fontSize: 7.5, color: COLOR.muted, fontFamily: "Helvetica-Bold" },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
  },
  // A "aba de categoria": retângulo colorido na borda esquerda, o elemento de
  // assinatura do produto (ver CLAUDE.md > Design).
  tab: { width: 3, height: 13, borderRadius: 2, marginRight: 7 },
  tdName: { flex: 1, fontSize: 8.5 },
  tdShare: { width: 42, fontSize: 8, color: COLOR.muted, textAlign: "right" },
  tdDelta: { width: 62, fontSize: 8, textAlign: "right" },
  tdTotal: {
    width: 78,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  empty: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 8,
    paddingVertical: 26,
    textAlign: "center",
    fontSize: 9,
    color: COLOR.muted,
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 38,
    right: 38,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: COLOR.muted },
});

function pctDelta(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return (cur - prev) / prev;
}

/** Texto da variação vs. período anterior, com a cor certa para o sentido. */
function deltaText(delta: number | null, goodWhen: "up" | "down") {
  if (delta === null || !isFinite(delta)) {
    return { text: "sem base anterior", color: COLOR.muted };
  }
  const good = goodWhen === "up" ? delta >= 0 : delta <= 0;
  const sign = delta > 0 ? "+" : "";
  return {
    text: `${sign}${Math.round(delta * 100)}% vs. anterior`,
    color: good ? COLOR.success : COLOR.destructive,
  };
}

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dayFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * `range.end` da API é EXCLUSIVO (ver reports.util.ts) — para agosto ele vem
 * como 1º de setembro. Recua um instante para exibir o último dia que de fato
 * pertence ao período, senão o cabeçalho anunciaria um mês a mais.
 */
function lastDayOf(exclusiveEnd: string): Date {
  return new Date(new Date(exclusiveEnd).getTime() - 1);
}

/**
 * Saldo acumulado ponto a ponto. Fora do componente de propósito: o acumulador
 * é mutável, e o lint (com razão) não aceita esse padrão dentro de um render.
 */
function cumulativeBalance(series: Report["series"]): number[] {
  let running = 0;
  return series.map((p) => {
    running += p.incomes - p.expenses;
    return running;
  });
}

interface ReportPdfProps {
  report: Report;
  /** Nome (ou e-mail) de quem gerou — o relatório é pessoal. */
  ownerName: string;
  generatedAt: Date;
  /**
   * Origem do logo. O padrão é o caminho servido pelo próprio app; existe como
   * prop para o documento poder ser renderizado fora do navegador (onde um
   * caminho relativo não resolve), que é como ele é testado.
   */
  logoSrc?: string;
}

export function ReportPdf({
  report,
  ownerName,
  generatedAt,
  logoSrc = "/prumo-mark.png",
}: ReportPdfProps) {
  const { totals, previous, series, byCategory, range } = report;

  // Escala compartilhada pelas duas barras, senão receita e despesa ficariam
  // em réguas diferentes e a comparação visual mentiria.
  const maxBar = Math.max(
    ...series.map((p) => Math.max(p.incomes, p.expenses)),
    1,
  );

  const balance = cumulativeBalance(series);
  const hasData = totals.incomes > 0 || totals.expenses > 0;

  return (
    <Document
      title={`Prumo — Relatório ${range.label}`}
      author="Prumo"
      subject={`Relatório financeiro de ${ownerName}`}
      creator="Prumo"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            <View style={styles.logoTile}>
              {/* O `Image` aqui é o do @react-pdf, não um <img> — não existe
                  prop `alt` nele, e um PDF não tem leitor de tela a servir. */}
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={styles.logo} src={logoSrc} />
            </View>
            <Text style={styles.brandName}>Prumo</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>Relatório financeiro</Text>
            <Text style={styles.docMeta}>{ownerName}</Text>
          </View>
        </View>

        <View style={styles.periodBand}>
          <View>
            <Text style={styles.periodLabel}>{range.label}</Text>
            <Text style={styles.periodRange}>
              {dayFmt.format(new Date(range.start))} a{" "}
              {dayFmt.format(lastDayOf(range.end))}
            </Text>
          </View>
          <Text style={styles.periodRange}>
            Gerado em {dateTimeFmt.format(generatedAt)}
          </Text>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <Kpi
            label="Receitas"
            value={totals.incomes}
            delta={pctDelta(totals.incomes, previous.incomes)}
            goodWhen="up"
          />
          <Kpi
            label="Despesas"
            value={totals.expenses}
            delta={pctDelta(totals.expenses, previous.expenses)}
            goodWhen="down"
          />
          <Kpi
            label="Saldo"
            value={totals.balance}
            delta={pctDelta(totals.balance, previous.balance)}
            goodWhen="up"
            valueColor={totals.balance >= 0 ? COLOR.success : COLOR.destructive}
          />
        </View>

        {!hasData ? (
          <Text style={styles.empty}>
            Nenhum lançamento registrado neste período.
          </Text>
        ) : (
          <>
            {/* Receitas x Despesas */}
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>Receitas × Despesas</Text>
              <Text style={styles.sectionSub}>Ao longo de {range.label}</Text>

              <View style={styles.chartBox}>
                <View style={styles.bars}>
                  {series.map((p, i) => (
                    <View key={i} style={styles.barGroup}>
                      <View style={styles.barPair}>
                        <Bar value={p.incomes} max={maxBar} color={COLOR.success} />
                        <Bar
                          value={p.expenses}
                          max={maxBar}
                          color={COLOR.destructive}
                        />
                      </View>
                      <Text style={styles.barLabel}>{p.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.legend}>
                  <LegendItem color={COLOR.success} label="Receitas" />
                  <LegendItem color={COLOR.destructive} label="Despesas" />
                </View>
              </View>
            </View>

            {/* Tendência de saldo */}
            {balance.length > 1 && (
              <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>Tendência de saldo</Text>
                <Text style={styles.sectionSub}>
                  Saldo acumulado ao longo do período
                </Text>
                <View style={styles.chartBox}>
                  <BalanceChart values={balance} />
                  <View style={styles.legend}>
                    <LegendItem color={COLOR.primary} label="Saldo acumulado" />
                    <Text style={styles.legendText}>
                      Fecha em {formatBRL(balance[balance.length - 1])}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Detalhe por categoria */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalhe por categoria</Text>
              <Text style={styles.sectionSub}>
                Despesas agrupadas, da maior para a menor
              </Text>

              {byCategory.length === 0 ? (
                <Text style={styles.empty}>Sem despesas no período.</Text>
              ) : (
                <View style={styles.table}>
                  <View style={styles.thead} fixed>
                    <Text style={[styles.th, { flex: 1, marginLeft: 10 }]}>
                      CATEGORIA
                    </Text>
                    <Text style={[styles.th, { width: 42, textAlign: "right" }]}>
                      %
                    </Text>
                    <Text style={[styles.th, { width: 62, textAlign: "right" }]}>
                      VARIAÇÃO
                    </Text>
                    <Text style={[styles.th, { width: 78, textAlign: "right" }]}>
                      TOTAL
                    </Text>
                  </View>

                  {byCategory.map((c) => {
                    // Na tabela a coluna é estreita: só o número, e travessão
                    // quando não há período anterior com que comparar.
                    const raw = pctDelta(c.total, c.previousTotal);
                    const d =
                      raw === null || !isFinite(raw)
                        ? { text: "—", color: COLOR.muted }
                        : {
                            text: `${raw > 0 ? "+" : ""}${Math.round(raw * 100)}%`,
                            color: raw <= 0 ? COLOR.success : COLOR.destructive,
                          };
                    return (
                      <View key={c.name} style={styles.tr} wrap={false}>
                        <View
                          style={[
                            styles.tab,
                            { backgroundColor: categoryColorHex(c.name) },
                          ]}
                        />
                        <Text style={styles.tdName}>{c.name}</Text>
                        <Text style={styles.tdShare}>
                          {Math.round(c.share * 100)}%
                        </Text>
                        <Text style={[styles.tdDelta, { color: d.color }]}>
                          {d.text}
                        </Text>
                        <Text style={styles.tdTotal}>{formatBRL(c.total)}</Text>
                      </View>
                    );
                  })}

                  <View style={[styles.tr, { backgroundColor: COLOR.mist }]}>
                    {/* Vão da "aba" colorida, para o rótulo alinhar com os nomes acima. */}
                    <View style={{ width: 10 }} />
                    <Text
                      style={[styles.tdName, { fontFamily: "Helvetica-Bold" }]}
                    >
                      Total de despesas
                    </Text>
                    <Text style={styles.tdShare} />
                    <Text style={styles.tdDelta} />
                    <Text style={styles.tdTotal}>
                      {formatBRL(totals.expenses)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Prumo — seu dia organizado. Documento gerado automaticamente.
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function Kpi({
  label,
  value,
  delta,
  goodWhen,
  valueColor,
}: {
  label: string;
  value: number;
  delta: number | null;
  goodWhen: "up" | "down";
  valueColor?: string;
}) {
  const d = deltaText(delta, goodWhen);
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, valueColor ? { color: valueColor } : {}]}>
        {formatBRL(value)}
      </Text>
      <Text style={[styles.kpiDelta, { color: d.color }]}>{d.text}</Text>
    </View>
  );
}

/** Altura útil das barras — tem de bater com `styles.barPair.height`. */
const BAR_AREA = 64;

/** Barra proporcional. Altura mínima para o valor pequeno não sumir da régua. */
function Bar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const height = value > 0 ? Math.max((value / max) * BAR_AREA, 1.5) : 0.6;
  return (
    <View
      style={{
        width: 9,
        height,
        backgroundColor: value > 0 ? color : COLOR.border,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
      }}
    />
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

/**
 * Linha do saldo acumulado. Vetorial (Svg), então continua nítida em qualquer
 * zoom. A escala inclui o zero para que saldo negativo apareça abaixo da
 * linha de base, e não apenas como uma curva mais baixa.
 */
function BalanceChart({ values }: { values: number[] }) {
  const W = 519;
  const H = 64;
  const pad = 6;

  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;

  const x = (i: number) =>
    values.length === 1
      ? W / 2
      : pad + (i * (W - pad * 2)) / (values.length - 1);
  const y = (v: number) => pad + ((max - v) / span) * (H - pad * 2);

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const zeroY = y(0);

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Line
        x1={0}
        y1={zeroY}
        x2={W}
        y2={zeroY}
        stroke={COLOR.border}
        strokeWidth={1}
      />
      <Polyline
        points={points}
        fill="none"
        stroke={COLOR.primary}
        strokeWidth={2}
      />
    </Svg>
  );
}

/** Nome de arquivo previsível: `prumo-relatorio-agosto-2026.pdf`. */
export function reportFileName(report: Report): string {
  const slug = report.range.label
    // NFD separa a letra do acento; o replace tira só o acento ("Março" → "Marco").
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `prumo-relatorio-${slug || "periodo"}.pdf`;
}
