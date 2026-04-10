"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-16 h-8 rounded-full bg-muted/20 animate-pulse border border-border/10" />
    )
  }

  const isDark = resolvedTheme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <button
        onClick={toggleTheme}
        className="relative w-16 h-8 rounded-full bg-background/40 backdrop-blur-md border border-border/40 shadow-inner flex items-center px-1 group transition-all duration-300 hover:border-teal-500/40"
        aria-label="Alternar tema"
      >
        {/* Sliding Indicator (Interruptor) */}
        <motion.div
          animate={{ x: isDark ? 32 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg flex items-center justify-center z-10"
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-white fill-current" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-white fill-current" />
          )}
        </motion.div>

        {/* Icons inside the track */}
        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-40">
          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-teal-600' : 'text-muted-foreground'}`} />
          <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-teal-600' : 'text-muted-foreground'}`} />
        </div>
      </button>
      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
        Ambiente {isDark ? 'Escuro' : 'Claro'}
      </span>
    </div>
  )
}
