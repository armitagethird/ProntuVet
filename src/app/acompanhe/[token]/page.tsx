import { createPublicClient } from '@/lib/supabase/public-client'
import { FileText, CalendarCheck, AlertCircle, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    robots: { index: false, follow: false, nocache: true },
    title: 'Prontuário Digital · ProntuVet',
}

export default async function ProntuLinkPage(props: { params: Promise<{ token: string }> }) {
    const { token } = await props.params

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
    if (!isUuid) return <ErrorPage />

    const supabase = createPublicClient()

    const { data, error } = await supabase
        .from('consultations')
        .select(`
            id,
            created_at,
            tutor_name,
            tutor_summary,
            tutor_token_expires_at,
            vet_display_name,
            animals (name, species)
        `)
        .eq('tutor_token', token)
        .gt('tutor_token_expires_at', new Date().toISOString())
        .maybeSingle()

    if (error || !data) {
        return <ErrorPage />
    }

    const animalName = (data.animals as any)?.name || 'Animal'
    const animalSpecies = (data.animals as any)?.species || ''
    const tutorName = data.tutor_name || 'Não informado'
    const vetDisplayName = (data.vet_display_name || '').trim()
    const customContent = (data.tutor_summary || '').trim()

    const expiresAt = new Date(data.tutor_token_expires_at as string)
    const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 text-slate-900">
            <header className="border-b border-teal-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-teal-700 text-lg">ProntuVet</span>
                    </div>
                    <span className="text-xs text-slate-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                        Prontuário Digital
                    </span>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8 space-y-5 pb-16">
                <div className="bg-white rounded-3xl border border-teal-100 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-8 text-white">
                        <p className="text-teal-200 text-xs uppercase tracking-widest font-semibold mb-1">Prontuário Clínico</p>
                        <h1 className="text-2xl font-bold mb-1">
                            {animalName}{animalSpecies ? ` · ${animalSpecies}` : ''}
                        </h1>
                        <p className="text-teal-200 text-sm">Tutor: {tutorName}</p>
                        {vetDisplayName && (
                            <p className="text-teal-100 text-sm mt-2 pt-2 border-t border-teal-500/30">
                                Atendido por <span className="font-semibold text-white">{vetDisplayName}</span>
                            </p>
                        )}
                    </div>

                    <div className="px-6 py-4 flex items-center gap-2 text-sm text-slate-600 border-b border-slate-100">
                        <CalendarCheck className="w-4 h-4 text-teal-500 shrink-0" />
                        <span className="capitalize">{formattedDate}</span>
                    </div>

                    <div className={`px-6 py-3 flex items-center gap-3 ${daysRemaining <= 5 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                        <Clock className={`w-4 h-4 shrink-0 ${daysRemaining <= 5 ? 'text-amber-500' : 'text-slate-400'}`} />
                        <p className={`text-xs font-medium ${daysRemaining <= 5 ? 'text-amber-700' : 'text-slate-600'}`}>
                            {daysRemaining <= 5
                                ? `Atenção: este link expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} (${expiresAt.toLocaleDateString('pt-BR')})`
                                : `Link válido até ${expiresAt.toLocaleDateString('pt-BR')} · ${daysRemaining} dias restantes`
                            }
                        </p>
                    </div>
                </div>

                {customContent ? (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600">Mensagem do veterinário</h2>
                        <div className="text-base text-slate-900 leading-relaxed whitespace-pre-wrap">
                            {customContent}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500">O veterinário ainda não personalizou o conteúdo deste prontuário.</p>
                    </div>
                )}

                <p className="text-center text-xs text-slate-500 pt-4">
                    Gerado pelo ProntuVet · Compartilhamento seguro de consulta
                </p>
            </main>
        </div>
    )
}

function ErrorPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 text-center text-slate-900">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Link não disponível</h1>
            <p className="text-slate-600 max-w-sm">
                Este link de prontuário não existe ou expirou. Solicite ao seu veterinário um novo link de acesso.
            </p>
            <div className="mt-8 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
                    <FileText className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold text-teal-700">ProntuVet</span>
            </div>
        </div>
    )
}
