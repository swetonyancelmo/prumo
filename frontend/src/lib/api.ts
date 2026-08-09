import {
  clearTokens,
  readTokens,
  writeTokens,
  type StoredTokens,
} from "./auth-storage";
import type { UserProfile } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface AuthResponse extends StoredTokens {
  user: UserProfile;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Erro ${res.status}`;
  try {
    const data = await res.json();
    const raw = data?.message ?? message;
    // O ZodValidationPipe devolve `errors: [{ message }]`; a primeira mensagem
    // é bem mais útil que o "Validation failed" genérico.
    if (Array.isArray(data?.errors) && data.errors[0]?.message) {
      message = data.errors[0].message;
    } else {
      message = Array.isArray(raw) ? raw.join(", ") : String(raw);
    }
  } catch {
    // resposta sem corpo JSON
  }
  return new ApiError(res.status, message);
}

/**
 * Renovação do access token, compartilhada entre chamadas simultâneas.
 *
 * Sem essa promessa única, uma tela que dispara 4 requests de uma vez (o
 * dashboard faz isso) tentaria 4 refreshes em paralelo ao expirar o token —
 * e os perdedores da corrida usariam um refresh token já rotacionado.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const tokens = readTokens();
      if (!tokens) return false;

      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          cache: "no-store",
        });

        if (!res.ok) {
          // Refresh inválido/expirado: a sessão acabou de verdade.
          clearTokens();
          return false;
        }

        const data = (await res.json()) as AuthResponse;
        writeTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        return true;
      } catch {
        // Falha de rede não é sessão inválida — não derruba o login.
        return false;
      }
    })();

    void refreshInFlight.finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  allowRetry = true,
): Promise<T> {
  const tokens = readTokens();
  const headers: Record<string, string> = {};
  if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  // Access token expirado: renova uma vez e repete o request original.
  if (res.status === 401 && allowRetry && tokens) {
    if (await refreshSession()) {
      return request<T>(method, path, body, false);
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/**
 * Endpoints públicos de sessão. Ficam fora do `api` porque não levam token e
 * não devem entrar no ciclo de refresh — um 401 aqui é credencial errada,
 * não sessão expirada.
 */
export const authApi = {
  async register(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<AuthResponse> {
    return postAuth("/auth/register", input);
  },

  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return postAuth("/auth/login", input);
  },
};

async function postAuth(
  path: string,
  body: unknown,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<AuthResponse>;
}
