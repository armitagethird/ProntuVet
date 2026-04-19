'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { createClient } from '@/lib/supabase/client'

export function OnboardingTour() {
  const supabase = createClient()
  const pathname = usePathname()
  const driverRef = useRef<any>(null)
  const isRunning = useRef(false)
  const isChecking = useRef(false)

  const startTour = async () => {
    // Prevent multiple instances if logic triggers twice
    if (isRunning.current) return
    isRunning.current = true

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(15, 23, 42, 0.75)',
      popoverClass: 'driverjs-theme', // Activate our premium CSS theme
      stagePadding: 12,
      popoverOffset: 25,
      onDestroyed: async () => {
        isRunning.current = false
        // Persist completion in user metadata
        await supabase.auth.updateUser({
          data: { has_seen_tutorial: true }
        })
      },
      nextBtnText: 'Continuar ➔',
      prevBtnText: 'Voltar',
      doneBtnText: 'Vamos Começar!',
      steps: [
        {
          popover: {
            title: '🐾 Bem-vindo ao ProntuVet!',
            description: 'Sua rotina clínica acaba de ganhar um superpoder. Vamos te mostrar como a IA vai trabalhar por você hoje.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '#template-selector',
          popover: {
            title: '📋 Inteligência Estruturada',
            description: 'Escolha o modelo ideal para cada caso. A IA usará essa estrutura para organizar seus pensamentos automaticamente.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '#start-listening',
          popover: {
            title: '🎙️ Sua Voz vira Prontuário',
            description: 'O coração do app! Clique para iniciar a escuta. Fale naturalmente com o tutor enquanto a IA cuida de toda a documentação.',
            side: "top",
            align: 'center'
          }
        },
        {
          element: '#nav-history',
          popover: {
            title: '📂 Memória Clínica Infinita',
            description: 'Aqui você acessa o histórico completo de todos os seus atendimentos anteriores em segundos.',
            side: "top",
            align: 'center'
          }
        },
        {
          element: '#nav-templates',
          popover: {
            title: '🛠️ Customize sua Prática',
            description: 'Crie novos campos ou modelos exclusivos para sua especialidade. O ProntuVet se adapta ao seu jeito de trabalhar.',
            side: "top",
            align: 'end'
          }
        },
        {
          popover: {
            title: '✨ Você está pronto!',
            description: 'O ProntuVet é intuitivo, mas sempre que precisar, nosso Centro de Ajuda está disponível no menu de perfil.',
            side: "bottom",
            align: 'center'
          }
        }
      ]
    })

    driverRef.current = driverObj
    driverObj.drive()
  }

  useEffect(() => {
    // 1. Path Guard: Only trigger automatic logic on the Dashboard
    if (pathname !== '/dashboard') {
      console.log("OnboardingTour: Path is not /dashboard, skipping. Current:", pathname)
      return
    }

    const checkAndStartTour = async (providedUser?: any) => {
      if (isChecking.current) return
      isChecking.current = true

      try {
        const user = providedUser || (await supabase.auth.getUser()).data.user
        
        // If user exists and hasn't seen the tutorial (or metadata is not set yet)
        const hasSeen = user?.user_metadata?.has_seen_tutorial
        
        console.log("OnboardingTour: Checking user state...", { hasSeen, userId: user?.id })

        if (user && !hasSeen) {
        // Wait for elements to be stable in the DOM
        let attempts = 0
        const interval = setInterval(() => {
          const target = document.querySelector('#template-selector')
          if (target) {
            console.log("OnboardingTour: Target element found, launching tour.")
            clearInterval(interval)
            startTour()
          }
          if (attempts > 12) { // 6 seconds timeout
            console.warn("OnboardingTour: Target element #template-selector not found after 6s")
            clearInterval(interval) 
          }
          attempts++
        }, 500)
        }
      } finally {
        isChecking.current = false
      }
    }

    // 2. Immediate check is handled by the INITIAL_SESSION event in onAuthStateChange below.
    // This avoids concurrent getUser() calls that cause the lock "stolen" error.

    // 3. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("OnboardingTour: Auth Event:", event)
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        checkAndStartTour(session?.user)
      }
    })

    // 4. Custom restart event
    const handleRestart = () => startTour()
    window.addEventListener('restart-onboarding', handleRestart)
    
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('restart-onboarding', handleRestart)
    }
  }, [supabase, pathname]) // Added pathname as dependency

  return null
}
