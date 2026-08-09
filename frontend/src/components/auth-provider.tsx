"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, authApi, ApiError } from "@/lib/api";
import {
  clearTokens,
  onTokensChanged,
  readTokens,
  writeTokens,
} from "@/lib/auth-storage";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  /** Perfil da sessão atual, ou null se não há sessão. */
  user: UserProfile | null;
  /** true enquanto a sessão guardada não foi verificada contra a API. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => void;
  /** Reflete no contexto um perfil alterado por outra tela (ex.: editar nome). */
  setUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Na montagem, valida contra a API o token guardado no navegador: ele pode
  // estar expirado, ou pertencer a uma conta já excluída. O `api` cuida de
  // renovar o access token com o refresh, se der.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!readTokens()) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const profile = await api.get<UserProfile>("/users/me");
        if (!cancelled) setUser(profile);
      } catch (e) {
        if (!cancelled && e instanceof ApiError && e.status === 401) {
          clearTokens();
        }
        // Erro de rede/servidor não apaga a sessão — só não carrega o perfil
        // agora; o guard do layout mostra o aviso de recarregar.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // A camada de API limpa os tokens quando o refresh falha. Sem escutar isso,
  // a UI continuaria mostrando o painel de uma sessão que já morreu.
  useEffect(() => {
    return onTokensChanged(() => {
      if (!readTokens()) setUser(null);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    writeTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    setUser(result.user);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const result = await authApi.register({ email, password, name });
      writeTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      setUser(result.user);
    },
    [],
  );

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  }
  return ctx;
}
