import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {/*
        No celular a ação principal ocupa a linha inteira: sobra alvo de toque
        e ela para de disputar espaço com o título em telas estreitas.
      */}
      {action && (
        <div className="w-full *:w-full sm:w-auto sm:*:w-auto">{action}</div>
      )}
    </div>
  );
}
