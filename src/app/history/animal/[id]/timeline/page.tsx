import { createClient } from '@/lib/supabase/server'
import { TimelineView } from '@/components/timeline-view'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PawPrint, History as HistoryIcon, Activity, Sparkles } from 'lucide-react'

export default async function AnimalTimelinePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    // 1. Fetch Animal Data
    const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('*')
        .eq('id', params.id)
        .single()

    if (animalError || !animal) {
        notFound()
    }

    // 2. Fetch all related consultation IDs with that name or same animal_id
    // This is the "Universal Identity Search" logic mirrored here
    const { data: relatedAnimals } = await supabase
        .from('animals')
        .select('id')
        .ilike('name', animal.name.trim())

    const animalIds = relatedAnimals?.map(a => a.id) || [params.id]
    const namePattern = `%${animal.name.trim()}%`

    // 3. Multilayered Search for the timeline
    const { data: consultations, error: historyError } = await supabase
        .from('consultations')
        .select('id, title, created_at, resumo_trilha, tags, animal_id')
        .or(`animal_id.in.(${animalIds.join(',')}),title.ilike.${namePattern}`)
        .order('created_at', { ascending: false })

    const formattedEvents = (consultations || []).map(c => ({
        id: c.id,
        title: c.title || 'Consulta sem título',
        date: c.created_at,
        resumo_trilha: c.resumo_trilha,
        tags: c.tags
    }))

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto space-y-8 animate-fade-in-up pt-8 px-4 pb-20">
            {/* Navigation Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <Link 
                    href="/history" 
                    className="group inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all hover:bg-muted/50 hover:text-foreground h-11 px-6 text-muted-foreground self-start md:self-center border border-border/40 backdrop-blur-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Voltar ao Histórico
                </Link>

                <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-full shadow-sm animate-pulse-soft">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-teal-700">Inteligência Clínica Unificada ativa</span>
                </div>
            </div>

            {/* Main Animal Identity Card */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-500/5 via-blue-500/5 to-transparent border border-border/40 shadow-2xl p-8 md:p-12 mb-10">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-teal-400 to-blue-500"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-teal-500/10 transition-colors duration-700"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="p-6 bg-background rounded-3xl shadow-xl shadow-teal-500/5 border border-border/40 text-teal-500">
                        <Activity className="w-12 h-12" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-[11px] font-bold tracking-widest uppercase border border-teal-500/20">
                                Jornada Clínica
                             </span>
                             {animal.species && (
                                <span className="text-muted-foreground text-sm font-medium">({animal.species})</span>
                             )}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground mb-4">
                            {animal.name}
                        </h1>
                        <p className="text-muted-foreground text-lg italic max-w-2xl leading-relaxed">
                            Histórico clínico consolidado integrando todos os registros identificados para este paciente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeline View Container with Glassmorphism */}
            <div className="relative bg-background/40 backdrop-blur-3xl border border-border/40 rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-teal-500/5 overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_left] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                
                <div className="relative z-10">
                    {formattedEvents.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/40">
                             <div className="bg-background/80 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/40 shadow-sm">
                                <HistoryIcon className="w-8 h-8 text-muted-foreground/30" />
                             </div>
                             <h3 className="text-xl font-bold">Nenhum evento clínico ainda</h3>
                             <p className="text-muted-foreground">O histórico detalhado aparecerá assim que as consultas forem salvas.</p>
                        </div>
                    ) : (
                        <TimelineView 
                            animalName={animal.name} 
                            events={formattedEvents} 
                        />
                    )}
                </div>
            </div>
            
            {/* Footer context */}
            <div className="text-center text-muted-foreground/50 text-xs pt-12 pb-8">
                ProntuVet Inteligência Clínica • Biografia consolidada por identificadores universais
            </div>
        </div>
    )
}
