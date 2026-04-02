import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, FileEdit, Dog } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function TemplatesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null;

    // Fetch templates
    const { data: templates } = await supabase
        .from('consultation_templates')
        .select('*')
        .order('is_system_default', { ascending: false })
        .order('created_at', { ascending: false })

    return (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full pt-8 pb-32 space-y-8 px-4 animate-fade-in-up">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <FileText className="w-8 h-8 text-teal-500" />
                        Modelos de Prontuário
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as estruturas que a IA usará para preencher as consultas.
                    </p>
                </div>
                <Link href="/templates/new">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6 transition-all shadow-lg hover:shadow-teal-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Novo Modelo
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* DEFAULT TEMPLATE */}
                <Card className="relative flex flex-col border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-xl hover:-translate-y-1 group">
                    <Link href={`/consultation/new?templateId=system-default`} className="flex-1 p-6 flex flex-col items-start gap-4">
                        <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 p-4 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:from-teal-500/20 group-hover:to-blue-500/20 transition-all duration-300">
                            <Dog className="w-8 h-8 text-teal-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl group-hover:text-teal-600 transition-colors">Prontuário Inteligente</h3>
                            <p className="text-sm text-muted-foreground mt-2">Padrão da IA para estruturar informações livremente.</p>
                        </div>
                    </Link>
                </Card>

                {/* CUSTOM TEMPLATES */}
                {templates?.filter(t => !t.is_system_default).map((template) => (
                    <Card key={template.id} className="relative flex flex-col border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/50 hover:shadow-md hover:-translate-y-1 group">
                        
                        <div className="absolute top-4 right-4 z-10 transition-opacity">
                            <Link href={`/templates/${template.id}/edit`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 rounded-full hover:bg-teal-500/10 text-muted-foreground hover:text-teal-600 shadow-sm border border-border/50">
                                    <FileEdit className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>

                        <Link href={`/consultation/new?templateId=${template.id}`} className="flex-1 p-6 flex flex-col items-start gap-4">
                            <div className="bg-gradient-to-br from-muted to-muted/50 border border-border/50 p-4 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:border-teal-500/30 transition-all duration-300">
                                <FileText className="w-8 h-8 text-foreground/70" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl group-hover:text-teal-600 transition-colors pr-8">{template.name}</h3>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                    Iniciar consulta com esta estrutura pré-definida.
                                </p>
                            </div>
                        </Link>
                    </Card>
                ))}
            </div>

        </div>
    )
}
