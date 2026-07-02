import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Placeholders evitam quebrar o build quando .env.local ainda não existe.
// Em runtime, sem as variáveis reais, a autenticação não vai funcionar — daí o aviso.
if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local.",
  );
}

/**
 * Cliente Supabase do navegador (singleton). Usado só para autenticação:
 * login/logout e obtenção do access token (JWT ES256) que autentica as
 * chamadas à API NestJS. Nenhuma query de dados passa direto pelo supabase-js
 * — os dados vêm sempre da API do backend.
 */
export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
