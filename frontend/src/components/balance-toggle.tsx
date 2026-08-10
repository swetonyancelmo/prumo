"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useBalanceVisibility } from "@/lib/use-balance-visibility";
import { Button } from "@/components/ui/button";

/**
 * "Olhinho" que mostra/oculta os valores em dinheiro da tela. O estado é global
 * (ver `use-balance-visibility.ts`), então vários botões refletem o mesmo estado.
 */
export function BalanceToggle({ className }: { className?: string }) {
  const { visible, toggle } = useBalanceVisibility();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={visible ? "Ocultar valores" : "Mostrar valores"}
      aria-pressed={!visible}
      className={className}
    >
      {visible ? <EyeIcon /> : <EyeOffIcon />}
    </Button>
  );
}
