import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dog, FileText, ArrowLeft, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function HistoryPage() {
    const supabase = await createClient()

    // Fetch all consultations for this user
    const { data: consultations, error } = await supabase
        .from('consultations')
        .select('id, title, mode, created_at')
        .order('created_at', { ascending: false })

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto space-y-8 animate-fade-in-up pt-8 px-4 pb-16">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-10">
                <Link href="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted/50 hover:text-foreground h-10 px-4 py-2 text-muted-foreground self-start mt-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Link>
                <div className="flex-1">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Clock className="w-8 h-8 text-amber-500" />
                        Histórico de Consultas
                    </h1>
                    <p className="text-muted-foreground text-lg mt-1">Revise as documentações geradas pela inteligência artificial.</p>
                </div>
            </div>

            {!consultations || consultations.length === 0 ? (
                <div className="text-center py-20 px-4 bg-muted/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-border/60 hover:border-amber-500/30 transition-colors animate-fade-in-up-delay-1">
                    <div className="bg-background/80 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <FileText className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">Nenhuma consulta registrada</h3>
                    <p className="text-muted-foreground mt-3 mb-8 max-w-md mx-auto text-base">
                        Você ainda não processou consultas com a inteligência artificial.
                    </p>
                    <Link href="/dashboard">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-lg shadow-amber-500/20 rounded-full h-12 px-6 text-base font-medium transition-transform hover:scale-105">
                            Iniciar Primeira Consulta
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up-delay-1">
                    {consultations.map((consultation, index) => (
                        <Link key={consultation.id} href={`/consultation/${consultation.id}`} className="group h-full block">
                            <Card
                                style={{ animationDelay: `${(index % 10) * 100}ms` }}
                                className="h-full flex flex-col border border-border/50 bg-card/60 backdrop-blur-sm hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 group-hover:-translate-y-2 relative overflow-hidden animate-fade-in-up"
                            >
                                {/* Decorative top gradient line */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                <CardHeader className="pb-3 pt-6 px-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-500 group-hover:from-amber-500/20 group-hover:to-orange-500/20 group-hover:scale-110 transition-all duration-300">
                                            <Dog className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors">
                                        {consultation.title || 'Consulta sem título'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 px-6 pb-2">
                                    <div className="flex items-center text-sm font-medium text-muted-foreground pt-2">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(consultation.created_at).toLocaleDateString('pt-BR', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 pb-6 px-6 mt-auto">
                                    <div className="w-full text-left text-sm font-bold text-amber-600 opacity-80 group-hover:opacity-100 flex items-center transition-all group-hover:translate-x-1">
                                        Abrir Prontuário <span className="ml-1 text-lg leading-none">→</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
