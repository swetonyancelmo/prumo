"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Lê a marca deixada por um atalho do PWA (segurar o ícone do app na tela de
 * início → "Novo lançamento" / "Nova tarefa", declarados em `app/manifest.ts`).
 *
 * Devolve `true` só na primeira renderização depois do atalho e já limpa a
 * query da URL — sem isso, voltar para a página ou recarregar reabriria o
 * diálogo para sempre. Por isso o valor serve para *inicializar* o estado do
 * diálogo (`useState(abrirPeloAtalho)`), não para controlá-lo.
 *
 * Quem usa precisa estar dentro de um `<Suspense>`: `useSearchParams` obriga o
 * Next a renderizar essa parte só no cliente.
 */
export function useShortcutFlag(param: string): boolean {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const active = searchParams.get(param) === "1";

  useEffect(() => {
    if (active) router.replace(pathname, { scroll: false });
  }, [active, pathname, router]);

  return active;
}
