"use client";

import { useEffect, useState } from "react";
import { ShareIcon, SquarePlusIcon, XIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";

const DISMISSED_KEY = "prumo.install-dismissed";

/**
 * Evento do Chrome/Edge que permite disparar o instalador de dentro da página.
 * Não está nos tipos padrão do DOM porque é proposta, não padrão fechado.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Env = {
  /** Já está rodando instalado — não há o que oferecer. */
  standalone: boolean;
  /** iPhone/iPad: o Safari nunca oferece instalar; só resta ensinar o caminho. */
  ios: boolean;
  dismissed: boolean;
};

/**
 * Convite para instalar o Prumo na tela de início.
 *
 * São dois mundos diferentes por baixo. No Android o navegador entrega o evento
 * `beforeinstallprompt` e a instalação vira um botão de verdade. No iOS esse
 * evento não existe e nunca existiu: a Apple só permite instalar pelo menu
 * Compartilhar do Safari, então ali o melhor possível é uma instrução curta.
 *
 * Some sozinho quando o app já está instalado (`display-mode: standalone`) e
 * fica escondido depois de dispensado.
 */
export function InstallPrompt() {
  const [env, setEnv] = useState<Env | null>(null);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    // Só dá para saber disso no cliente, daí a leitura acontecer no efeito.
    setEnv({
      standalone:
        window.matchMedia("(display-mode: standalone)").matches ||
        // O Safari do iOS não implementa display-mode; usa esta flag própria.
        ("standalone" in window.navigator &&
          Boolean((window.navigator as { standalone?: boolean }).standalone)),
      ios: /iPad|iPhone|iPod/.test(window.navigator.userAgent),
      dismissed: window.localStorage.getItem(DISMISSED_KEY) === "1",
    });
    /* eslint-enable react-hooks/set-state-in-effect */

    function onBeforeInstall(e: Event) {
      // Sem isto o Chrome mostra o próprio banner, e ficariam dois convites.
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setEnv((prev) => (prev ? { ...prev, standalone: true } : prev));
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setEnv((prev) => (prev ? { ...prev, dismissed: true } : prev));
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (!env || env.standalone || env.dismissed) return null;
  // Fora do iOS, sem o evento do navegador não há o que oferecer: ou o app já
  // está instalado, ou o navegador não suporta instalar.
  if (!env.ios && !installEvent) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border bg-card p-4">
      <LogoMark className="mt-0.5 size-9" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Instale o Prumo no seu celular</p>
        {env.ios ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Toque em{" "}
            <ShareIcon
              aria-label="Compartilhar"
              className="inline size-4 -translate-y-px"
            />{" "}
            na barra do Safari e escolha{" "}
            <span className="font-medium text-foreground">
              Adicionar à Tela de Início
            </span>{" "}
            <SquarePlusIcon aria-hidden className="inline size-4 -translate-y-px" />
            .
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Abre em tela cheia, com ícone próprio, direto no seu painel.
            </p>
            <Button className="mt-3" size="lg" onClick={install}>
              <DownloadIcon data-icon="inline-start" />
              Instalar app
            </Button>
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        aria-label="Dispensar"
        className="-mr-1 -mt-1 shrink-0"
      >
        <XIcon />
      </Button>
    </div>
  );
}
