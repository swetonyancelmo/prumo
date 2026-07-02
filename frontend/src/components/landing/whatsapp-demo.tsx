import { CategoryTab } from "@/components/category-tab";

/**
 * Demonstração estática do fluxo-assinatura do Ordenai: uma mensagem em
 * linguagem natural vira despesa + tarefa estruturadas. Não é interativo —
 * é a "vitrine" do hero.
 */
export function WhatsappDemo() {
  return (
    <div className="w-full max-w-sm rounded-3xl border bg-card p-4 shadow-[0_20px_60px_-20px_rgba(43,42,51,0.25)]">
      {/* Cabeçalho estilo conversa */}
      <div className="mb-4 flex items-center gap-3 border-b pb-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-success/15 text-success">
          <span className="size-2.5 rounded-full bg-success" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Ordenai</p>
          <p className="text-xs text-muted-foreground">no seu WhatsApp</p>
        </div>
      </div>

      {/* Mensagem do usuário */}
      <div className="mb-3 flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
          Gastei 45 reais de almoço hoje e me lembra de pagar a conta de luz
          amanhã
        </p>
      </div>

      {/* Resposta do Ordenai com dados extraídos */}
      <div className="flex justify-start">
        <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
          <p className="mb-2.5 text-sm">Anotado! Confere pra mim ✅</p>

          <div className="flex flex-col gap-2">
            <div className="flex items-stretch gap-2.5 rounded-xl bg-card p-2.5">
              <CategoryTab colorKey="Alimentação" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Almoço</p>
                <p className="text-xs text-muted-foreground">
                  Despesa · Alimentação · hoje
                </p>
              </div>
              <span className="self-center text-sm font-semibold tabular-nums text-destructive">
                − R$ 45,00
              </span>
            </div>

            <div className="flex items-stretch gap-2.5 rounded-xl bg-card p-2.5">
              <span
                aria-hidden
                className="w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: "var(--chart-4)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  Pagar conta de luz
                </p>
                <p className="text-xs text-muted-foreground">
                  Tarefa · vence amanhã
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
