import type { Metadata } from "next";
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
  openGraph: {
    title: "Prumo — suas finanças e tarefas, organizadas",
    description:
      "Registre, organize e acompanhe finanças e tarefas num painel web tranquilo.",
    siteName: "Prumo",
    locale: "pt_BR",
    type: "website",
  },
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
