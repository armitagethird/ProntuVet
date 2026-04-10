'use client'

import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { createClient } from '@/lib/supabase/client'

export function OnboardingTour() {
  const supabase = createClient()
  const driverRef = useRef<any>(null)
  const isRunning = useRef(false)

  const startTour = async () => {
    // Prevent multiple instances if logic triggers twice
    if (isRunning.current) return
    isRunning.current = true

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      stagePadding: 12,
      popoverOffset: 45,
      onDestroyed: async () => {
        isRunning.current = false
        // Persist completion in user metadata
        await supabase.auth.updateUser({
          data: { has_seen_tutorial: true }
        })
      },
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Entendi!',
      steps: [
        {
          popover: {
            title: '🐾 Bem-vindo ao ProntuVet!',
            description: 'Olá! Sou seu assistente de IA. Vou te mostrar como transformar suas consultas em prontuários perfeitos em segundos. Vamos lá?',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '#template-selector',
          popover: {
            title: '📋 Escolha sua Ferramenta',
            description: 'Aqui você seleciona qual "esqueleto" de prontuário quer usar. Pode ser o padrão ou um que você mesmo criou para casos específicos.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '#start-listening',
          popover: {
            title: '🎙️ O Grande Momento',
            description: 'Quando o paciente entrar, clique aqui! A IA vai ouvir tudo e estruturar o prontuário para você. É quase mágica!',
            side: "top",
            align: 'center'
          }
        },
        {
          element: '#nav-history',
          popover: {
            title: '📂 Memória de Elefante',
            description: 'Aqui ficam guardadas todas as suas consultas passadas. Histórico completo na palma da mão.',
            side: "top",
            align: 'center'
          }
        },
        {
          element: '#nav-templates',
          popover: {
            title: '🛠️ Suas Regras',
            description: 'Quer que o prontuário tenha uma seção de "Banho e Tosa" ou "Exames de Imagem"? Crie seus próprios modelos aqui!',
            side: "top",
            align: 'end'
          }
        },
        {
          popover: {
            title: '✨ Tudo Pronto!',
            description: 'Agora você já sabe o básico. Qualquer dúvida, é só clicar no botão de ajuda que preparei para você ali no cantinho!',
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
    // 1. Listen for auth state changes (login, registration, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const user = session?.user
        if (user && !user.user_metadata?.has_seen_tutorial) {
          // Delay to ensure components are fully rendered after login transition
          setTimeout(startTour, 2000)
        }
      }
    })

    // 2. Listen for custom restart event from Help Center
    const handleRestart = () => {
      startTour()
    }

    window.addEventListener('restart-onboarding', handleRestart)
    
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('restart-onboarding', handleRestart)
    }
  }, [supabase])

  return null
}
