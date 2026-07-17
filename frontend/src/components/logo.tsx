import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Marca do Prumo: o "prumo" (fio de prumo) roxo num tile branco arredondado.
 * O tile funciona como chip sobre qualquer fundo (claro/escuro), sem virar um
 * quadrado branco solto. Fonte em assets/brand/prumo-logo.png; o PNG servido
 * (public/prumo-mark.png) é gerado a partir dela.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/prumo-mark.png"
      alt="Prumo"
      width={40}
      height={40}
      className={cn("size-8 rounded-[22%]", className)}
      priority
    />
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
        Prumo
      </span>
    </span>
  );
}
