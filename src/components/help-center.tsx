'use client'

import { useState } from 'react'
import { HelpCircle, Mail, BookOpen, RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  const handleRestartTutorial = async () => {
    try {
      // Reset the metadata
      const { error } = await supabase.auth.updateUser({
        data: { has_seen_tutorial: false }
      })

      if (error) throw error

      toast.success('Reiniciando tutorial...')
      setIsOpen(false)
      
      // Dispatch custom event to trigger the OnboardingTour without page reload
      window.dispatchEvent(new CustomEvent('restart-onboarding'))
    } catch (error) {
      console.error('Error resetting tutorial:', error)
      toast.error('Erro ao reiniciar tutorial')
    }
  }

  return (
    <div className="fixed bottom-28 right-6 z-[60] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.3 }}
            style={{ transformOrigin: 'bottom right' }}
            className="w-80 bg-background/60 backdrop-blur-3xl border border-teal-500/20 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.12)] mb-2"
          >
            {/* Header with subtle gradient */}
            <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 p-6 border-b border-teal-500/10">
              <h3 className="text-xl font-black text-foreground tracking-tight">Ajuda</h3>
              <p className="text-xs font-semibold text-teal-600/70 uppercase tracking-widest mt-0.5">Central de Suporte</p>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={handleRestartTutorial}
                className="w-full flex items-center gap-4 p-4 rounded-3xl bg-teal-500/5 hover:bg-teal-500/10 text-teal-700 transition-all text-sm font-bold group border border-teal-500/5 hover:border-teal-500/20"
              >
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-3 rounded-2xl shadow-lg shadow-teal-500/20 group-hover:rotate-180 transition-transform duration-700">
                    <RefreshCw className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block">Reiniciar Tutorial</span>
                  <span className="text-[10px] text-teal-600/50 font-medium">Rever as dicas iniciais</span>
                </div>
              </button>

              <a
                href="mailto:suporte@prontuvet.com"
                className="w-full flex items-center gap-4 p-4 rounded-3xl bg-blue-500/5 hover:bg-blue-500/10 text-blue-700 transition-all text-sm font-bold group border border-blue-500/5 hover:border-blue-500/20"
              >
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block">Suporte por E-mail</span>
                  <span className="text-[10px] text-blue-600/50 font-medium">Fale com nosso time</span>
                </div>
              </a>

              <a
                href="https://docs.prontuvet.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-4 p-4 rounded-3xl bg-purple-500/5 hover:bg-purple-500/10 text-purple-700 transition-all text-sm font-bold group border border-purple-500/5 hover:border-purple-500/20"
              >
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-3 rounded-2xl shadow-lg shadow-purple-500/20 group-hover:translate-x-1 transition-transform">
                    <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block">Documentação</span>
                  <span className="text-[10px] text-purple-600/50 font-medium">Guia completo de uso</span>
                </div>
              </a>
            </div>

            <div className="px-6 py-4 bg-muted/20 border-t border-border/50 flex justify-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-40">
                ProntuVet v1.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-teal-500/20 border-2 border-white/20 hover:shadow-teal-500/40 transition-shadow z-[70]"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="help"
              initial={{ rotate: 180, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -180, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <HelpCircle className="w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
