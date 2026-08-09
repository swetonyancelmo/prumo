import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prumo.app"),
  title: {
    default: "Prumo — suas finanças e tarefas, organizadas",
    template: "%s · Prumo",
  },
  description:
    "Painel web para registrar despesas, receitas e tarefas, organizar por categoria e acompanhar o mês com relatórios claros.",
  applicationName: "Prumo",
  // Instalado na tela de início do iPhone, o Safari lê estas duas: a primeira
  // faz o app abrir sem a barra de endereço, a segunda é o nome sob o ícone.
  appleWebApp: {
    capable: true,
    title: "Prumo",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Prumo — suas finanças e tarefas, organizadas",
    description:
      "Registre, organize e acompanhe finanças e tarefas num painel web tranquilo.",
    siteName: "Prumo",
    locale: "pt_BR",
    type: "website",
  },
};

/**
 * `themeColor` pinta a barra de status do celular quando o app roda instalado.
 * São duas porque o Prumo tem tema claro e escuro — uma cor só deixaria a barra
 * brigando com o topo do app em um dos dois. Os valores espelham `--sidebar`
 * (o fundo do header) no `globals.css`.
 *
 * `viewportFit: "cover"` deixa o app usar a área sob o notch; o rodapé já
 * compensa com `env(safe-area-inset-bottom)` no `app-shell`.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#232230" },
  ],
  viewportFit: "cover",
  // Sem travar o zoom: o usuário pode precisar ampliar, e bloquear isso é
  // barreira de acessibilidade.
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${figtree.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
