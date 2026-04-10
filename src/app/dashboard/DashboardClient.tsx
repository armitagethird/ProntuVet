'use client'

import { useState, useEffect, useTransition, Suspense, use } from 'react'
import { Activity, Dog, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

import { ThemeToggle } from '@/components/ui/theme-toggle'

interface Template {
  id: string
  name: string
}

interface DashboardClientProps {
  userFirstName: string
  templatesPromise: Promise<Template[]>
}

const STORAGE_KEY = 'prontuvet_selected_template'

export function DashboardClient({ userFirstName, templatesPromise }: DashboardClientProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('system-default')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Load from localStorage on mount. Validamos se o ID passado no localstorage bate com os templates no banco (promessa)
  useEffect(() => {
    let active = true;
    const fetchLocalState = async () => {
      try {
        const templates = await templatesPromise;
        if (!active) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const exists = saved === 'system-default' || templates.some((t: any) => t.id === saved);
          if (exists) {
            setSelectedTemplateId(saved);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLocalState();
    return () => { active = false };
  }, [templatesPromise])

  // Prefetch agressivo invisível: Cacheia o layout gigante do gravador de áudio antes mesmo de você clicar!
  useEffect(() => {
    router.prefetch('/consultation/new')
  }, [router])

  // Save to localStorage on change
  const handleTemplateChange = (id: string | null) => {
    if (!id) return;
    setSelectedTemplateId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const handleStartListening = () => {
    startTransition(() => {
      router.push(`/consultation/new?templateId=${selectedTemplateId}`)
    })
  }



  // Removed isLoaded blocking skeleton to improve FCP/LCP drastically.

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full h-full min-h-[75vh] px-4 animate-fade-in-up pb-32">
      <div className="text-center mb-8 flex flex-col items-center">
        {/* Theme Switcher Placement */}
        <ThemeToggle />

        {/* Styled Logo Signature */}
        <div className="flex items-center justify-center gap-1 mb-4 group cursor-default select-none">
          <span className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 tracking-tighter drop-shadow-sm">
            Prontu
          </span>
          <span className="text-5xl md:text-6xl font-black text-foreground tracking-tighter relative">
            Vet
            <div className="absolute top-1 -right-3 w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.6)]" />
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90 mb-2 px-4">
          Pronto para atender?
        </h1>
        <p className="text-base text-muted-foreground w-full max-w-xl mx-auto">
          Olá, <span className="font-medium text-foreground">{userFirstName}</span>! Inicie uma nova consulta.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 transition-all duration-700">
        {/* Template Selector Card */}
        <div id="template-selector" className="bg-card/40 backdrop-blur-sm border border-teal-500/10 rounded-[2.5rem] p-5 shadow-xl shadow-black/5 relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
             <label className="text-[9px] font-bold text-teal-600/60 uppercase tracking-[0.2em] mb-2 block px-1">
                 Modelo de Prontuário
             </label>
             <Suspense fallback={<div className="h-12 w-full animate-pulse bg-teal-500/10 rounded-2xl border border-teal-500/20" />}>
                 <TemplateSelectorUI 
                     templatesPromise={templatesPromise} 
                     selectedTemplateId={selectedTemplateId} 
                     handleTemplateChange={handleTemplateChange} 
                 />
             </Suspense>
        </div>

        {/* Main Action Link */}
        <button 
          id="start-listening" 
          onClick={handleStartListening}
          disabled={isPending}
          suppressHydrationWarning 
          className="group w-full focus:outline-none focus:ring-4 focus:ring-teal-500/20 rounded-[2.5rem] disabled:opacity-90 disabled:cursor-wait text-left"
        >
          <div className="relative overflow-hidden border border-teal-500/20 bg-card/85 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:scale-[1.02] hover:border-teal-500/50 hover:shadow-[0_20px_40px_rgba(20,184,166,0.15)] flex flex-col items-center justify-center text-center gap-4">
            {/* Hover Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 transition-opacity duration-500 ${isPending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            
            <div className={`relative bg-teal-500 bg-gradient-to-br from-teal-500 to-teal-600 text-white p-4 rounded-2xl shadow-xl shadow-teal-500/20 transition-transform duration-500 z-10 ${isPending ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
                {isPending ? <Loader2 className="w-8 h-8 animate-spin" /> : <Dog className="w-8 h-8" />}
            </div>
            
            <div className={`relative z-10 transition-transform duration-500 ${isPending ? 'translate-y-[-2px]' : 'group-hover:translate-y-[-2px]'}`}>
              <h2 className={`text-2xl font-bold tracking-tight mb-1 transition-colors ${isPending ? 'text-teal-600' : 'group-hover:text-teal-600'}`}>
                  {isPending ? 'Carregando Módulo...' : 'Iniciar Escuta'}
              </h2>
              <p className={`text-sm text-muted-foreground transition-colors ${isPending ? 'text-foreground/80' : 'group-hover:text-foreground/80'}`}>Gerar prontuário com IA</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

function TemplateSelectorUI({ templatesPromise, selectedTemplateId, handleTemplateChange }: any) {
    const templates = use(templatesPromise) as Template[]
    
    const getSelectedName = () => {
        if (selectedTemplateId === 'system-default') return 'Prontuário Padrão';
        const template = templates.find(t => t.id === selectedTemplateId);
        return template ? template.name : selectedTemplateId;
    }

    return (
        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-full bg-background/40 border-teal-500/20 focus:ring-teal-500/30 rounded-2xl h-12 text-sm font-medium shadow-sm transition-all hover:border-teal-500/40">
                <SelectValue placeholder="Selecione um modelo">
                    <span suppressHydrationWarning>{getSelectedName()}</span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-teal-500/10 backdrop-blur-2xl p-2">
                <SelectItem value="system-default" className="rounded-xl py-3 focus:bg-teal-500/10 focus:text-teal-700 cursor-pointer transition-colors">
                    Prontuário Padrão
                </SelectItem>
                {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="rounded-xl py-3 focus:bg-teal-500/10 focus:text-teal-700 cursor-pointer transition-colors">
                        {t.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

