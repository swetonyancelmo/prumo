import { cn } from "@/lib/utils";

/** Marca do Ordenai: squircle Orquídea com um "check" — o caderno organizado. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      role="img"
      aria-label="Ordenai"
    >
      <rect width="32" height="32" rx="10" fill="var(--primary)" />
      <path
        d="M9 16.8l4.2 4.2L23 11.4"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className="font-heading text-xl font-semibold tracking-tight">
        Ordenai
      </span>
    </span>
  );
}
