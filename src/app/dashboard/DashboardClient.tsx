'use client'

import { useState, useEffect } from 'react'
import { Activity, Dog } from 'lucide-react'
import Link from 'next/link'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface Template {
  id: string
  name: string
}

interface DashboardClientProps {
  userFirstName: string
  templates: Template[]
}

const STORAGE_KEY = 'prontuvet_selected_template'

export function DashboardClient({ userFirstName, templates }: DashboardClientProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('system-default')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      // Verify if the saved template still exists in the user's templates list
      // Or if it's the system default. If not found, fallback to system_default.
      const exists = saved === 'system-default' || templates.some(t => t.id === saved)
      if (exists) {
        setSelectedTemplateId(saved)
      }
    }
    setIsLoaded(true)
  }, [templates])

  // Save to localStorage on change
  const handleTemplateChange = (id: string | null) => {
    if (!id) return;
    setSelectedTemplateId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const getSelectedName = () => {
    if (selectedTemplateId === 'system-default') return 'Prontuário Padrão';
    const template = templates.find(t => t.id === selectedTemplateId);
    return template ? template.name : selectedTemplateId;
  }



  // To avoid hydration mismatch while loading localStorage
  if (!isLoaded) {
    return (
       <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full h-full min-h-[70vh] px-4 animate-pulse pb-24">
            <div className="h-20 w-20 bg-muted rounded-full mb-6" />
            <div className="h-8 w-64 bg-muted rounded mb-4" />
            <div className="h-4 w-48 bg-muted rounded" />
       </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full h-full min-h-[75vh] px-4 animate-fade-in-up pb-24">
      <div className="text-center mb-12">
        {/* Styled Logo Signature */}
        <div className="flex items-center justify-center gap-1 mb-6 group cursor-default select-none">
          <span className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 tracking-tighter drop-shadow-sm">
            Prontu
          </span>
          <span className="text-5xl md:text-6xl font-black text-foreground tracking-tighter relative">
            Vet
            <div className="absolute top-1 -right-3 w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.6)]" />
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground/90 mb-4 px-4">
          Pronto para atender?
        </h1>
        <p className="text-lg text-muted-foreground w-full max-w-xl mx-auto">
          Olá, <span className="font-medium text-foreground">{userFirstName}</span>! Inicie uma nova consulta com o modelo selecionado abaixo.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-8 transition-all duration-700 gpu-accelerated">
        {/* Template Selector Card */}
        <div id="template-selector" className="bg-card/30 backdrop-blur-sm md:backdrop-blur-xl border border-teal-500/10 rounded-[2rem] p-6 shadow-xl shadow-black/5 relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
             <label className="text-[10px] font-bold text-teal-600/60 uppercase tracking-[0.2em] mb-3 block px-1">
                 Modelo de Prontuário Selecionado
             </label>
             <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full bg-background/40 border-teal-500/20 focus:ring-teal-500/30 rounded-2xl h-14 text-base font-medium shadow-sm transition-all hover:border-teal-500/40">
                    <SelectValue placeholder="Selecione um modelo">
                        {getSelectedName()}
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
        </div>

        {/* Main Action Link */}
        <Link id="start-listening" href={`/consultation/new?templateId=${selectedTemplateId}`} className="group focus:outline-none focus:ring-4 focus:ring-teal-500/20 rounded-3xl gpu-accelerated">
          <div className="relative overflow-hidden border border-teal-500/20 bg-card/60 backdrop-blur-sm md:backdrop-blur-xl rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:scale-[1.03] hover:border-teal-500/50 hover:shadow-[0_20px_40px_rgba(20,184,166,0.15)] flex flex-col items-center justify-center text-center gap-6">
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Pulsing effect in background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative bg-teal-500 bg-gradient-to-br from-teal-500 to-teal-600 text-white p-5 rounded-2xl shadow-xl shadow-teal-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 z-10">
                <Dog className="w-10 h-10" />
            </div>
            
            <div className="relative z-10 transition-transform duration-500 group-hover:translate-y-[-2px]">
              <h2 className="text-3xl font-bold tracking-tight mb-2 group-hover:text-teal-600 transition-colors">Iniciar Escuta</h2>
              <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors">Gerar prontuário com IA</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
