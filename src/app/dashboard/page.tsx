import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dog, FileText, Plus, FileEdit, Clock, Activity, PawPrint, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null;
    }

    // Fetch templates
    const { data: templates } = await supabase
        .from('consultation_templates')
        .select('*')
        .order('is_system_default', { ascending: false })
        .order('created_at', { ascending: false })

    // Fetch metrics
    const { count: consultationCount } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })

    const { count: animalCount } = await supabase
        .from('animals')
        .select('*', { count: 'exact', head: true })

    // Fetch recent animals
    const { data: recentAnimals } = await supabase
        .from('animals')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(4)

    return (
        <div className="flex-1 flex flex-col items-center justify-start max-w-6xl mx-auto w-full pt-8 pb-16 space-y-12 animate-fade-in-up px-4">

            {/* Header & Quick Metrics */}
            <div className="w-full flex justify-between items-end gap-6 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Activity className="w-8 h-8 text-teal-500" />
                        Painel de Controle
                    </h1>
                    <p className="text-muted-foreground mt-1">Bem-vindo(a) de volta! Como posso ajudar na sua rotina hoje?</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-card/50 border border-border/50 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-teal-500/10 rounded-full text-teal-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold leading-none">{consultationCount || 0}</p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Consultas</p>
                        </div>
                    </div>
                    <div className="bg-card/50 border border-border/50 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
                            <PawPrint className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold leading-none">{animalCount || 0}</p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Pacientes</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">

                {/* Left Column: Templates for New Consultation */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-teal-500" /> Nova Consulta
                        </h2>
                        <Link href="/templates/new">
                            <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-500/10 h-8 px-3 text-sm rounded-full">
                                Criar Modelo Personalizado
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card
                            className="relative h-full flex flex-col border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 group"
                        >
                            <Link href={`/consultation/new?templateId=system-default`} className="flex-1 p-5 flex items-start gap-4">
                                <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 p-3 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:from-teal-500/20 group-hover:to-blue-500/20 transition-all duration-300">
                                    <Dog className="w-6 h-6 text-teal-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg group-hover:text-teal-600 transition-colors">Prontuário Inteligente</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">Padrão da IA para estruturar informações livremente.</p>
                                </div>
                            </Link>
                        </Card>

                        {templates?.filter(t => !t.is_system_default).map((template) => (
                            <Card
                                key={template.id}
                                className="relative h-full flex flex-col border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-md hover:-translate-y-1 group"
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Link href={`/templates/${template.id}/edit`}>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/50 rounded-full hover:bg-teal-500/10 text-muted-foreground hover:text-teal-600">
                                            <FileEdit className="w-3 h-3" />
                                        </Button>
                                    </Link>
                                </div>

                                <Link href={`/consultation/new?templateId=${template.id}`} className="flex-1 p-5 flex items-start gap-4">
                                    <div className="bg-gradient-to-br from-muted to-muted/50 border border-border/50 p-3 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:border-teal-500/30 transition-all duration-300">
                                        <FileText className="w-6 h-6 text-foreground/70" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg group-hover:text-teal-600 transition-colors">{template.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">Iniciar com estrutura personalizada.</p>
                                    </div>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Column: Recent Animals */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-teal-500" /> Pacientes Recentes
                        </h2>
                        <Link href="/history?view=animal">
                            <Button variant="ghost" className="text-muted-foreground h-8 px-2 text-xs rounded-full">Ver todos</Button>
                        </Link>
                    </div>

                    <div className="bg-card/40 border border-border/50 rounded-2xl p-2 backdrop-blur-sm divide-y divide-border/30 shadow-sm">
                        {recentAnimals && recentAnimals.length > 0 ? (
                            recentAnimals.map(animal => (
                                <Link key={animal.id} href={`/history`} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0">
                                        <PawPrint className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-foreground capitalize truncate group-hover:text-teal-600 transition-colors">
                                            {animal.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                            {animal.species && <span className="capitalize">{animal.species} •</span>}
                                            Atendido em {new Date(animal.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                Nenhum paciente registrado ainda.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <div className="pt-6 w-full flex justify-center border-t border-border/40 mt-8">
                <Link href="/history" className="group flex items-center justify-center px-6 py-3 text-sm font-medium transition-all hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground">
                    <Calendar className="w-4 h-4 mr-2 group-hover:text-teal-500 transition-colors" />
                    Ir para o Histórico Geral
                </Link>
            </div>
        </div>
    )
}
