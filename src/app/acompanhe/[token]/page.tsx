import { createPublicClient } from '@/lib/supabase/public-client'
import { FileText, CalendarCheck, AlertCircle, Clock, Building2, Stethoscope, MessageSquare, Pill, Microscope, Paperclip } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    robots: { index: false, follow: false, nocache: true },
    title: 'Prontuário Digital · ProntuVet',
}

interface Medicacao {
    nome: string
    dose?: string
    frequencia?: string
    duracao?: string
    observacoes?: string
}

interface AnexoPL {
    nome: string
    storage_path: string
    tamanho_bytes: number
    tipo_mime: string
}

interface ProntuLinkSession {
    id: string
    tipo: 'mensagem' | 'medicacao' | 'exame' | 'anexo'
    titulo?: string
    conteudo?: string
    resultado?: string
    medicacoes?: Medicacao[]
    anexos?: AnexoPL[]
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
            title,
            created_at,
            tutor_name,
            tutor_summary,
            tutor_token_expires_at,
            vet_display_name,
            prontulink_clinic_name,
            prontulink_animal_photo_url,
            prontulink_sessions,
            animals (name, species)
        `)
        .eq('tutor_token', token)
        .gt('tutor_token_expires_at', new Date().toISOString())
        .maybeSingle()

    if (error || !data) {
        return <ErrorPage />
    }

    // Fallback: extrai nome do título "Consulta: Thor" para consultas sem animal_id vinculado
    const nameFromTitle = (() => {
        const t = (data as any).title || ''
        const m = t.match(/^Consulta:\s*(.+)$/i)
        if (!m) return ''
        const n = m[1].trim()
        return n.toLowerCase() === 'animal' ? '' : n
    })()

    const animalName = (data.animals as any)?.name || nameFromTitle || 'Animal'
    const animalSpecies = (data.animals as any)?.species || ''
    const tutorName = data.tutor_name || 'Não informado'
    const vetDisplayName = (data.vet_display_name || '').trim()
    const clinicName = ((data as any).prontulink_clinic_name || '').trim()
    const customContent = (data.tutor_summary || '').trim()
    const animalPhotoPath = ((data as any).prontulink_animal_photo_url || '').trim()
    const sessions: ProntuLinkSession[] = Array.isArray((data as any).prontulink_sessions)
        ? (data as any).prontulink_sessions
        : []

    const expiresAt = new Date(data.tutor_token_expires_at as string)
    const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const assetUrl = (path: string) =>
        `/api/prontulink-asset?token=${encodeURIComponent(token)}&path=${encodeURIComponent(path)}`

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
                {/* Hero card */}
                <div className="bg-white rounded-3xl border border-teal-100 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-8 text-white">
                        <div className="flex items-start gap-4">
                            {animalPhotoPath && (
                                <img
                                    src={assetUrl(animalPhotoPath)}
                                    alt={`Foto de ${animalName}`}
                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"
                                />
                            )}
                            <div className="min-w-0">
                                <p className="text-teal-200 text-xs uppercase tracking-widest font-semibold mb-1">Prontuário Clínico</p>
                                <h1 className="text-2xl font-bold mb-1">
                                    {animalName}{animalSpecies ? ` · ${animalSpecies}` : ''}
                                </h1>
                                <p className="text-teal-200 text-sm">Tutor: {tutorName}</p>
                                {(clinicName || vetDisplayName) && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-teal-500/30">
                                        {clinicName && (
                                            <span className="text-teal-100 text-xs flex items-center gap-1.5">
                                                <Building2 className="w-3 h-3 shrink-0" /> {clinicName}
                                            </span>
                                        )}
                                        {vetDisplayName && (
                                            <span className="text-teal-100 text-sm flex items-center gap-1.5">
                                                <Stethoscope className="w-3 h-3 shrink-0" />
                                                Atendido por <strong className="text-white ml-1">{vetDisplayName}</strong>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
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

                {/* Vet message */}
                {customContent && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" /> Mensagem do veterinário
                        </h2>
                        <div className="text-base text-slate-900 leading-relaxed whitespace-pre-wrap">
                            {customContent}
                        </div>
                    </div>
                )}

                {/* Sessions */}
                {sessions.map(session => (
                    <div key={session.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            {session.tipo === 'mensagem' && <MessageSquare className="w-4 h-4 text-teal-500" />}
                            {session.tipo === 'medicacao' && <Pill className="w-4 h-4 text-blue-500" />}
                            {session.tipo === 'exame' && <Microscope className="w-4 h-4 text-purple-500" />}
                            {session.tipo === 'anexo' && <Paperclip className="w-4 h-4 text-orange-500" />}
                            <h2 className="font-bold text-slate-900">
                                {session.titulo || (
                                    session.tipo === 'mensagem' ? 'Mensagem' :
                                    session.tipo === 'medicacao' ? 'Medicações' :
                                    session.tipo === 'exame' ? 'Exame' : 'Anexo'
                                )}
                            </h2>
                        </div>
                        <div className="px-6 py-5">
                            {session.tipo === 'mensagem' && session.conteudo && (
                                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{session.conteudo}</p>
                            )}

                            {session.tipo === 'exame' && (
                                <div className="space-y-3">
                                    {session.conteudo && (
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{session.conteudo}</p>
                                    )}
                                    {session.resultado && (
                                        <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                                            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Resultado</p>
                                            <p className="text-slate-900 font-medium">{session.resultado}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {session.tipo === 'medicacao' && session.medicacoes && session.medicacoes.length > 0 && (
                                <div className="space-y-3">
                                    {session.medicacoes.map((med, i) => (
                                        <div key={i} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="font-bold text-slate-900">{med.nome}</p>
                                            {(med.dose || med.frequencia || med.duracao) && (
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
                                                    {med.dose && <span>Dose: <strong>{med.dose}</strong></span>}
                                                    {med.frequencia && <span>Frequência: <strong>{med.frequencia}</strong></span>}
                                                    {med.duracao && <span>Duração: <strong>{med.duracao}</strong></span>}
                                                </div>
                                            )}
                                            {med.observacoes && (
                                                <p className="text-sm text-slate-600 mt-1.5 italic">{med.observacoes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {session.tipo === 'anexo' && session.anexos && session.anexos.length > 0 && (
                                <div className="space-y-3">
                                    {session.anexos.map((anexo, i) => {
                                        const isImg = anexo.tipo_mime?.startsWith('image/')
                                        return (
                                            <div key={i} className="space-y-2">
                                                {isImg && (
                                                    <img
                                                        src={assetUrl(anexo.storage_path)}
                                                        alt={anexo.nome}
                                                        className="rounded-xl max-w-full max-h-64 object-contain border border-slate-200"
                                                    />
                                                )}
                                                <a
                                                    href={assetUrl(anexo.storage_path)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
                                                >
                                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span className="truncate">{anexo.nome}</span>
                                                    <span className="text-xs text-slate-400 ml-auto shrink-0">({Math.round(anexo.tamanho_bytes / 1024)}KB)</span>
                                                </a>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Empty state */}
                {!customContent && sessions.length === 0 && (
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
