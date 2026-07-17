import { cn } from "@/lib/utils";
import { categoryColor } from "@/lib/format";

/**
 * Elemento de assinatura do Prumo: a "aba de categoria" — um retângulo
 * arredondado vertical, colorido pela categoria, encostado na borda esquerda
 * de itens de lista e cartões. É o "index tab" do fichário, repetido em
 * despesas, receitas e tarefas.
 */
export function CategoryTab({
  colorKey,
  className,
}: {
  colorKey: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("w-1.5 shrink-0 self-stretch rounded-full", className)}
      style={{ backgroundColor: categoryColor(colorKey) }}
    />
  );
}
