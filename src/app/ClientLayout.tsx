"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DockNav } from "@/components/ui/dock-nav";
// removed direct import for Toaster
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from "next/dynamic";

// Dynamically import heavy/non-critical components to reduce first-paint JS bundle
const HelpCenter = dynamic(() => import("@/components/help-center").then(mod => mod.HelpCenter), { ssr: false });
const OnboardingTour = dynamic(() => import("@/components/onboarding-tour").then(mod => mod.OnboardingTour), { ssr: false });
const Toaster = dynamic(() => import("sonner").then(mod => mod.Toaster), { ssr: false });

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-background overflow-hidden">
        {/* New Ultra-Minimalist Dot Pattern with Radial Masking */}
        <div className="absolute inset-0 bg-premium-grid opacity-100" />
        
        {/* Soft Branding Glow */}
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_1000px_at_50%_-200px,var(--primary)/0.08,transparent)]" />
      </div>
      
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Changed to popLayout for immediate concurrent transitions, making it feel 2x faster */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }} // Native-style quick cubic-bezier
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <DockNav />
      <HelpCenter />
      <OnboardingTour />
      <Analytics />
      <Toaster richColors position="top-right" closeButton />
      <SpeedInsights />
    </>
  );
}
