"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * GET simples com estado de carregamento/erro e refetch manual. Suficiente
 * para o painel da Fase 2 (sem cache global). `enabled=false` adia a busca.
 */
export function useResource<T>(path: string, enabled = true): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.get<T>(path));
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Não foi possível carregar.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    // Busca de dados no mount: efeito de sincronização legítimo com um sistema
    // externo (a API). O setState de loading é intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (enabled) void refetch();
  }, [enabled, refetch]);

  return { data, loading, error, refetch };
}
