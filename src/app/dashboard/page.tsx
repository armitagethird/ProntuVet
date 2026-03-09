import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dog, FileText, Plus, FileEdit, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    // Fetch templates
    const { data: templates, error } = await supabase
        .from('consultation_templates')
        .select('*')
        .order('is_system_default', { ascending: false })
        .order('created_at', { ascending: false })

    const hasTemplates = templates && templates.length > 0;

    return (
        <div className="flex-1 flex flex-col items-center justify-start max-w-6xl mx-auto w-full pt-12 pb-16 space-y-10 animate-fade-in-up px-4">

            <header className="text-center space-y-3 w-full animate-fade-in-up">
                <div className="inline-flex items-center justify-center p-2 bg-amber-500/10 rounded-full mb-2">
                    <Dog className="w-6 h-6 text-amber-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Nova Consulta</h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    Escolha um modelo de prontuário abaixo para iniciar a gravação da consulta e deixar a IA trabalhar por você.
                </p>
            </header>

            <div className="w-full flex justify-end animate-fade-in-up-delay-1">
                <Link href="/templates/new">
                    <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 hover:scale-105 transition-all duration-300">
                        <Plus className="w-4 h-4" />
                        Criar Novo Modelo
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-fade-in-up-delay-1">
                {/* Default System Model (Always visible) */}
                <Card
                    className="relative h-full flex flex-col border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-2 group animate-fade-in-up"
                    style={{ animationDelay: '0ms' }}
                >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <Link href={`/consultation/new?templateId=system-default`} className="flex-1 flex flex-col">
                        <CardHeader className="text-center pb-2 pt-8">
                            <div className="mx-auto bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-all duration-300 relative">
                                <Dog className="w-8 h-8 text-amber-500 relative z-10" />
                            </div>
                            <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-amber-600 transition-colors">Prontuário Inteligente (IA)</CardTitle>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/20 inline-block px-3 py-1 rounded-full mx-auto mt-3">
                                Padrão do Sistema
                            </div>
                        </CardHeader>
                        <CardContent className="text-center flex-1 flex flex-col justify-end px-6 pb-6">
                            <CardDescription className="text-sm line-clamp-2 mt-2 mb-6 text-muted-foreground/80">
                                Deixe a IA organizar livremente as informações da consulta com base nas melhores práticas veterinárias.
                            </CardDescription>
                            <Button variant="outline" className="w-full border-amber-500/30 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-300">
                                Iniciar Consulta
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* User Models */}
                {templates?.map((template, index) => {
                    // Skip if the DB returned a row marked as system default because we are hardcoding it above
                    if (template.is_system_default) return null;

                    return (
                        <Card
                            key={template.id}
                            style={{ animationDelay: `${((index + 1) % 10) * 100}ms` }}
                            className="relative h-full flex flex-col border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-2 group animate-fade-in-up"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 translate-y-[-10px] group-hover:translate-y-0">
                                <Link href={`/templates/${template.id}/edit`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur text-muted-foreground hover:text-amber-500 hover:bg-background shadow-xs rounded-full">
                                        <FileEdit className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            <Link href={`/consultation/new?templateId=${template.id}`} className="flex-1 flex flex-col">
                                <CardHeader className="text-center pb-2 pt-8">
                                    <div className="mx-auto bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-all duration-300">
                                        <FileText className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-amber-600 transition-colors">{template.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center flex-1 flex flex-col justify-end px-6 pb-6">
                                    <CardDescription className="text-sm line-clamp-2 mt-2 mb-6 text-muted-foreground/80">
                                        Clique para iniciar a gravação usando a estrutura deste modelo personalizado.
                                    </CardDescription>
                                    <Button variant="outline" className="w-full border-amber-500/30 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-300">
                                        Selecionar Modelo
                                    </Button>
                                </CardContent>
                            </Link>
                        </Card>
                    )
                })}
            </div>

            <div className="pt-10 w-full flex justify-center animate-fade-in-up-delay-2 border-t border-border/40 mt-12">
                <Link href="/history" className="group inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-all hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground">
                    <Clock className="w-4 h-4 mr-2 group-hover:text-amber-500 transition-colors" />
                    Ver Histórico de Consultas Anteriores
                </Link>
            </div>
        </div>
    )
}
