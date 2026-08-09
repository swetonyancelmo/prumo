import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA — é o que torna o Prumo instalável na tela de início.
 *
 * `start_url` aponta para /dashboard, não para /: quem instalou o app já
 * decidiu que é usuário; abrir na landing de marketing seria um passo a mais
 * toda vez. Quem não tem sessão cai no /login pelo guard do layout.
 *
 * O ícone `maskable` é separado do comum de propósito: o Android recorta o
 * ícone numa forma própria e só o círculo central de 80% é seguro — sem uma
 * versão com folga, a marca sairia cortada.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prumo — finanças e tarefas",
    short_name: "Prumo",
    description:
      "Registre despesas, receitas e tarefas, organize por categoria e acompanhe o mês com relatórios claros.",
    lang: "pt-BR",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f2f7", // Névoa — o fundo do app no tema claro
    theme_color: "#ffffff", // barra de status acompanha o topo (--sidebar)
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Novo lançamento",
        short_name: "Lançar",
        url: "/financas?novo=1",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Nova tarefa",
        short_name: "Tarefa",
        url: "/tarefas?nova=1",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
