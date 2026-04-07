import { createClient } from '@/lib/supabase/server'
import { FileText, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HistoryList } from '@/components/history-list'

export default async function HistoryPage() {
    const supabase = await createClient()

    // Fetch all consultations for this user, including animal relations
    const { data: consultations, error } = await supabase
        .from('consultations')
        .select(`
            id, 
            title, 
            mode, 
            created_at,
            tags,
            tutor_name,
            structured_content,
            animal_id,
            resumo_trilha,
            animals ( id, name, species )
        `)
        .order('created_at', { ascending: false })
        .limit(30)

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto space-y-8 animate-fade-in-up pt-8 px-4 pb-16">
            <div className="flex flex-col items-start gap-4 mb-10">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Clock className="w-8 h-8 text-teal-500" />
                        Histórico de Consultas
                    </h1>
                    <p className="text-muted-foreground text-lg mt-1">Busque pacientes, reveja prontuários e filtre por categorias.</p>
                </div>
            </div>

            {!consultations || consultations.length === 0 ? (
                <div className="text-center py-20 px-4 bg-muted/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-border/60 hover:border-teal-500/30 transition-colors animate-fade-in-up-delay-1">
                    <div className="bg-background/80 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <FileText className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">Nenhuma consulta registrada</h3>
                    <p className="text-muted-foreground mt-3 mb-8 max-w-md mx-auto text-base">
                        Você ainda não processou consultas com a inteligência artificial.
                    </p>
                    <Link href="/dashboard">
                        <Button className="bg-teal-500 hover:bg-teal-600 text-white gap-2 shadow-lg shadow-teal-500/20 rounded-full h-12 px-6 text-base font-medium transition-transform hover:scale-105">
                            Iniciar Primeira Consulta
                        </Button>
                    </Link>
                </div>
            ) : (
                <HistoryList initialData={(consultations as any) || []} />
            )}
        </div>
    )
}
