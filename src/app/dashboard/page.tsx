import { Activity, Dog } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null;
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full h-full min-h-[70vh] px-4 animate-fade-in-up pb-24">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-4 bg-teal-500/10 rounded-full mb-6 ring-4 ring-teal-500/5">
                    <Activity className="w-10 h-10 text-teal-600" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                    Pronto para atender?
                </h1>
                <p className="text-lg text-muted-foreground w-full max-w-xl mx-auto">
                    Olá, <span className="font-medium text-foreground">{user.user_metadata?.first_name || 'Doutor(a)'}</span>! Inicie uma nova consulta com escuta inteligente e geração automática de prontuário.
                </p>
            </div>

            <Link href={`/consultation/new?templateId=system-default`} className="w-full max-w-md group focus:outline-none focus:ring-4 focus:ring-teal-500/20 rounded-3xl">
                <div className="relative overflow-hidden border border-teal-500/20 bg-card/60 backdrop-blur-xl rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:scale-[1.03] hover:border-teal-500/50 hover:shadow-[0_20px_40px_rgba(20,184,166,0.15)] flex flex-col items-center justify-center text-center gap-6">
                    {/* Hover Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Pulsing effect in background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="relative bg-teal-500 bg-gradient-to-br from-teal-500 to-teal-600 text-white p-5 rounded-2xl shadow-xl shadow-teal-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 z-10">
                         <Dog className="w-10 h-10" />
                    </div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold tracking-tight mb-2 group-hover:text-teal-600 transition-colors">Iniciar Escuta</h2>
                        <p className="text-muted-foreground">Gravar áudio e processar com IA</p>
                    </div>
                </div>
            </Link>
        </div>
    )
}
