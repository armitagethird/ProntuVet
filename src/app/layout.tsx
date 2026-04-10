import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { DockNav } from "@/components/ui/dock-nav";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { HelpCenter } from "@/components/help-center";
import { OnboardingTour } from "@/components/onboarding-tour";
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
      <body
        className={`${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#0284c71a,transparent)]"></div>
        </div>
        {children}
        <DockNav />
        <HelpCenter />
        <OnboardingTour />
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
