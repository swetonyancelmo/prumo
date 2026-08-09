/**
 * Guarda os tokens da sessão no navegador.
 *
 * Por que localStorage e não cookie httpOnly: em produção o frontend fica na
 * Vercel e a API no Render — domínios diferentes. Um cookie de sessão entre
 * eles seria third-party (`SameSite=None`), justamente a categoria que os
 * navegadores vêm bloqueando. localStorage é o que funciona de forma previsível
 * nessa topologia. O custo é ficar exposto a XSS; por isso o token de acesso é
 * curto (15min) e o refresh pode ser revogado trocando o JWT_SECRET.
 *
 * Módulo sem React de propósito: a camada de API (`lib/api.ts`) precisa ler o
 * token fora de qualquer componente.
 */

const ACCESS_KEY = "prumo.accessToken";
const REFRESH_KEY = "prumo.refreshToken";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Avisa a árvore React quando a sessão muda fora dela — o caso que importa é
 * o refresh falhar no meio de um request e derrubar a sessão.
 */
export function onTokensChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

export function readTokens(): StoredTokens | null {
  // SSR: não há localStorage. As telas autenticadas são client-side (ver
  // AGENTS.md), então o valor real chega na hidratação.
  if (typeof window === "undefined") return null;

  const accessToken = window.localStorage.getItem(ACCESS_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

export function writeTokens(tokens: StoredTokens): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  notify();
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  notify();
}
