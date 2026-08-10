"use client";

/**
 * Controla se os valores em dinheiro aparecem na tela ("olhinho").
 *
 * O padrão é OCULTO e o estado NÃO é persistido: ao abrir ou recarregar o app,
 * o saldo começa escondido — é o ponto da feature (não expor quanto se tem na
 * frente de outras pessoas). Dentro da mesma sessão, o estado é compartilhado
 * entre as telas (dashboard, finanças), então revelar numa vale na outra.
 *
 * Store em memória com pub-sub, no mesmo espírito de `auth-storage.ts`, porém
 * sem localStorage — de propósito, para reiniciar em "oculto" a cada reload.
 */

import { useSyncExternalStore } from "react";

let visible = false;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Placeholder exibido no lugar do valor quando está oculto. */
export const HIDDEN_AMOUNT = "R$ ••••";

export function toggleBalanceVisibility(): void {
  visible = !visible;
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return visible;
}

// No servidor não há sessão; o valor real chega na hidratação. "Oculto" é o
// padrão seguro tanto no SSR quanto no cliente, então não há flash de valores.
function getServerSnapshot(): boolean {
  return false;
}

export function useBalanceVisibility(): {
  visible: boolean;
  toggle: () => void;
} {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { visible: value, toggle: toggleBalanceVisibility };
}
