import { LogoMark } from "@/components/logo";
import { Spinner } from "@/components/ui/spinner";

export function Splash({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
      <LogoMark className="size-11" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        {label}
      </div>
    </div>
  );
}
