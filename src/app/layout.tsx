import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ClientLayout } from "./ClientLayout";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProntuVet",
  description: "Assistente veterinário de alto nível impulsionado por IA.",
  icons: {
    icon: "/prontuvet-icon.png",
    apple: "/prontuvet-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
