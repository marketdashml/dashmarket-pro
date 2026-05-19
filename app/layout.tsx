import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DASHMARKET-PRO",
  description:
    "Dashboard operacional de vendas, estoque Full, publicidade, anuncios e margem de contribuicao por SKU — Mercado Livre."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
