const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Aceita o Decimal serializado como string (ou number) e devolve número. */
export function parseAmount(value: string | number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatBRL(value: string | number): string {
  return brl.format(parseAmount(value));
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const dateFmtFull = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return dateFmt.format(new Date(iso));
}

export function formatDateFull(iso: string | null): string {
  if (!iso) return "sem data";
  return dateFmtFull.format(new Date(iso));
}

/** Rótulo do mês atual, ex.: "Julho 2026" (com inicial maiúscula). */
export function currentMonthLabel(ref = new Date()): string {
  const s = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(ref);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isSameMonth(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
  );
}

/** Dias até o vencimento (negativo = atrasado). null se sem data. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/** Converte um instante ISO para o formato do <input type="date"> (dia LOCAL). */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Converte "yyyy-mm-dd" (dia escolhido no input) em ISO. Ancora ao MEIO-DIA
 * local para que o dia de calendário não escorregue ao serializar para UTC —
 * evita o clássico off-by-one em fusos negativos (ex.: UTC−3 no Brasil).
 */
export function dateInputToISO(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

/** Combina "yyyy-mm-dd" + "HH:MM" (hora LOCAL) em ISO. Para compromissos. */
export function dateTimeInputToISO(
  dateValue: string,
  timeValue: string,
): string {
  const [y, m, d] = dateValue.split("-").map(Number);
  const [hh, mm] = timeValue.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0).toISOString();
}

/** Extrai "HH:MM" (hora LOCAL) de um instante ISO. */
export function toTimeInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

/** "14:00" a partir de um ISO. */
export function formatTime(iso: string | null): string {
  if (!iso) return "";
  return timeFmt.format(new Date(iso));
}

// Paleta categórica (bate com --chart-1..5 do globals.css).
const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Cor estável por chave (id/nome da categoria) — a "aba" de assinatura. */
export function categoryColor(key: string | null | undefined): string {
  if (!key) return "var(--muted-foreground)";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}
