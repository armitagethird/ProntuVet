import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { ClientLayout } from "./ClientLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ProntuVet - Clínica Veterinária de Alta Performance",
  description: "Assistente veterinário de alto nível impulsionado por IA. Gestão técnica e precisão clínica.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ProntuVet",
  },
  icons: {
    icon: "/prontuvet-icon.png",
    apple: "/prontuvet-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false} // User requested exclusive toggle
          disableTransitionOnChange
        >
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
