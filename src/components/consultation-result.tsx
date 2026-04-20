'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Save, Copy, Check, ArrowLeft, Loader2, FileText,
    CalendarCheck, FileEdit, Tag, Stethoscope,
    Trash2, AlertTriangle, History as HistoryIcon, ArrowRight,
    Paperclip, Download, Activity, MoreVertical, Settings, Share2, Lock,
    Building2, Camera, Plus, Pill, Microscope, MessageSquare, X, UploadCloud, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from "@/components/ui/sheet"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useEffect, useRef } from 'react'
import { AttachmentZone } from './attachments/attachment-zone'
import { AttachmentList } from './attachments/attachment-list'
import { createClient } from '@/lib/supabase/client'
import { uploadAttachment } from '@/lib/storage-client'
import dynamic from 'next/dynamic'
import { TimelineView } from './timeline-view'

// Note: PDF library is loaded inside the component's useEffect to avoid SSR/Hydration issues
// specifically related to dynamic() which can cause 'su is not a function' in React 19.

interface Medicacao {
    nome: string
    dose: string
    frequencia: string
    duracao: string
    observacoes: string
}

interface AnexoPL {
    nome: string
    storage_path: string
    tamanho_bytes: number
    tipo_mime: string
}

type SessionTipo = 'mensagem' | 'medicacao' | 'exame' | 'anexo'

interface ProntuLinkSession {
    id: string
    tipo: SessionTipo
    titulo: string
    conteudo?: string
    resultado?: string
    medicacoes?: Medicacao[]
    anexos?: AnexoPL[]
    criado_em: string
}

interface ConsultationData {
    id: string
    title: string
    mode: 'human' | 'vet'
    structured_content: Record<string, string>
    created_at: string
    animal_id?: string
    tutor_name?: string
    tutor_summary?: string
    vet_summary?: string
    manual_notes?: string
    tags?: string[]
    animals?: { name: string, species?: string }
    tutor_token?: string
    tutor_token_expires_at?: string
    vet_display_name?: string
    prontulink_clinic_name?: string
    prontulink_animal_photo_url?: string
    prontulink_sessions?: ProntuLinkSession[]
}

/** Entrada do histórico clínico de um animal — alinha com TimelineEvent */
interface HistoryEntry {
    id: string
    title: string
    date: string
    resumo_trilha: string | null
    tags?: string[]
}

/** Animal candidato a duplicata ou correspondência */
interface AnimalMatch {
    id: string
    name: string
    species?: string
    last_tutor_name?: string
}

/** Componentes do PDF carregados dinamicamente */
interface PDFLib {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Link: React.ComponentType<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Report: React.ComponentType<any>
}

export function ConsultationResult({ data }: { data: ConsultationData }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [title, setTitle] = useState(data.title || '')

    // States for editable fields
    const [content, setContent] = useState<Record<string, string>>(data.structured_content || {})
    const [tutorSummary, setTutorSummary] = useState(data.tutor_summary || '')
    const [vetSummary, setVetSummary] = useState(data.vet_summary || '')
    const [manualNotes, setManualNotes] = useState(data.manual_notes || '')

    // New states for header editing
    // Fallback: extrai nome do título "Consulta: Thor" para consultas sem animal_id vinculado
    const nameFromTitle = (() => {
        const m = (data.title || '').match(/^Consulta:\s*(.+)$/i)
        if (!m) return ''
        const n = m[1].trim()
        return n.toLowerCase() === 'animal' ? '' : n
    })()
    const [animalName, setAnimalName] = useState(data.animals?.name || nameFromTitle || '')
    const [animalSpecies, setAnimalSpecies] = useState(data.animals?.species || '')
    const [tutorName, setTutorName] = useState(data.tutor_name || '')
    const [vetDisplayName, setVetDisplayName] = useState(data.vet_display_name || '')

    // History and Matching States
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [matchingAnimal, setMatchingAnimal] = useState<AnimalMatch | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [plano, setPlano] = useState<string>('free')
    const [refreshAttachments, setRefreshAttachments] = useState(0)
    const [isMounted, setIsMounted] = useState(false)
    const [PDFComponents, setPDFComponents] = useState<PDFLib | null>(null)
    const [isDuplicateNameDetected, setIsDuplicateNameDetected] = useState(false)
    const [duplicateCandidate, setDuplicateCandidate] = useState<AnimalMatch | null>(null)
    const [activeTab, setActiveTab] = useState('prontuario')
    const [isNavOpen, setIsNavOpen] = useState(false)
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null)

    // ProntuLink extra state
    const [prontuLinkClinic, setProntuLinkClinic] = useState(data.prontulink_clinic_name || '')
    const [prontuLinkPhotoUrl, setProntuLinkPhotoUrl] = useState(data.prontulink_animal_photo_url || '')
    const [prontuLinkSessions, setProntuLinkSessions] = useState<ProntuLinkSession[]>(
        Array.isArray(data.prontulink_sessions) ? (data.prontulink_sessions as ProntuLinkSession[]) : []
    )
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const [uploadingSessionId, setUploadingSessionId] = useState<string | null>(null)
    const photoInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setIsMounted(true)

        const loadPDF = async () => {
            try {
                const renderer = await import('@react-pdf/renderer')
                const report = await import('./pdf-report')
                setPDFComponents({
                    Link: renderer.PDFDownloadLink,
                    Report: report.PDFReport
                })
            } catch (err) {
                console.error("PDF Load Error", err)
            }
        }
        loadPDF()

        const loadUserInfo = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)
            const { data: profile } = await supabase
                .from('profiles')
                .select('plano, first_name, last_name')
                .eq('id', user.id)
                .single()
            if (profile?.plano) setPlano(profile.plano)

            // Pré-preenche assinatura do ProntuLink com "Dr(a). Nome Sobrenome" se ainda vazia
            if (!data.vet_display_name) {
                const nome = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
                if (nome) setVetDisplayName(`Dr(a). ${nome}`)
            }
        }
        loadUserInfo()
    }, [])

    // Active Identity Guard: Seach for duplicates as user types
    const handleAnimalNameChange = (newName: string) => {
        setAnimalName(newName)
        
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        
        if (!newName || newName.length < 2 || data.animal_id) {
            setIsDuplicateNameDetected(false)
            setDuplicateCandidate(null)
            return
        }

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/animals/search?name=${encodeURIComponent(newName)}`)
                if (res.ok) {
                    const { animals } = await res.json()
                    // Filter for EXACT case-insensitive matches
                    const exactMatch = animals?.find((a: any) => a.name.toLowerCase() === newName.toLowerCase())
                    
                    if (exactMatch && exactMatch.id !== data.animal_id) {
                        setDuplicateCandidate(exactMatch)
                        setIsDuplicateNameDetected(true)
                    } else {
                        setIsDuplicateNameDetected(false)
                    }
                }
            } catch (err) {
                console.error("Identity Guard Error", err)
            }
        }, 400)
    }

    const resolveAsSamePet = () => {
        if (!duplicateCandidate) return
        setMatchingAnimal(duplicateCandidate)
        setAnimalName(duplicateCandidate.name)
        setAnimalSpecies(duplicateCandidate.species || animalSpecies)
        setTutorName(duplicateCandidate.last_tutor_name || tutorName)
        setIsDuplicateNameDetected(false)
        toast.success("Histórico vinculado com sucesso!")
    }

    const resolveAsNewPet = async () => {
        if (!duplicateCandidate) return
        // Captura o nome atual antes do await para evitar stale closure no toast
        const currentName = animalName
        try {
            const res = await fetch(`/api/animals/search?name=${encodeURIComponent(currentName)}`)
            const { animals } = await res.json()
            const count = animals?.length || 1
            const suffix = ` (#${count + 1})`
            setAnimalName(prev => `${prev}${suffix}`)
            setIsDuplicateNameDetected(false)
            setMatchingAnimal(null)
            toast.info(`Diferenciando como novo cadastro: ${currentName}${suffix}`)
        } catch (err: unknown) {
            setAnimalName(prev => `${prev} (Novo)`)
            setIsDuplicateNameDetected(false)
        }
    }

    // Broad History Unification: Load past records when name or ID changes
    useEffect(() => {
        const controller = new AbortController()

        const loadHistory = async () => {
            const hasId = data.animal_id || matchingAnimal?.id
            const hasName = animalName && animalName.length >= 2
            
            if (!hasId && !hasName) {
                setHistory([])
                return
            }

            setIsLoadingHistory(true)
            try {
                const endpoint = hasId 
                    ? `/api/animals/${hasId}/history` 
                    : `/api/animals/history-by-name?name=${encodeURIComponent(animalName)}`

                const res = await fetch(endpoint, { signal: controller.signal })
                if (res.ok) {
                    const { history: historyData } = await res.json()
                    setHistory((historyData as HistoryEntry[]).filter(h => h.id !== data.id))
                }
            } catch (err: unknown) {
                // Ignora cancelamentos de AbortController (efeito re-executado)
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error("History load error", err)
                }
            } finally {
                setIsLoadingHistory(false)
            }
        }

        loadHistory()
        return () => controller.abort()
    }, [data.animal_id, matchingAnimal?.id, animalName, data.id])

    // Unified Timeline Logic: Current + History
    const getFullTimeline = () => {
        const currentEvent = {
            id: data.id,
            title: title || data.title || 'Consulta Atual',
            date: data.created_at,
            resumo_trilha: vetSummary || 'Registro em andamento...',
            tags: data.tags || []
        }
        
        // Combine, filter out current if it exists in history (deduplicate by id)
        const pastEvents = history.filter(h => h.id !== data.id)
        const combined = [currentEvent, ...pastEvents]
        
        // Sort by date descending
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    const handleImportData = () => {
        if (!matchingAnimal) return
        setTutorName(matchingAnimal.last_tutor_name || tutorName)
        setAnimalSpecies(matchingAnimal.species || animalSpecies)
        toast.success(`Dados de ${animalName} importados do histórico!`)
        setMatchingAnimal(null) // Clear banner after import
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/consultations/${data.id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Prontuário excluído com sucesso')
                router.push('/history')
            } else {
                throw new Error()
            }
        } catch (err) {
            toast.error('Erro ao excluir prontuário')
            setIsDeleting(false)
        }
    }

    // Format content as plain text for copying
    const getFormattedText = () => {
        let text = `# ${data.title}\n`
        if (animalName) text += `Paciente: ${animalName}${animalSpecies ? ` (${animalSpecies})` : ''}\n`
        if (tutorName) text += `Tutor: ${tutorName}\n`
        text += `\n`

        const mainContent = Object.entries(content)
            .filter(([_, value]) => value && value.trim() !== '' && value !== 'Não reportado no áudio')
            .map(([key, value]) => `## ${key}\n${value}`)
            .join('\n\n')

        text += mainContent;

        if (vetSummary) text += `\n\n## Resumo Clínico\n${vetSummary}`
        if (manualNotes) text += `\n\n## Notas Manuais\n${manualNotes}`

        return text
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(getFormattedText())
            setCopied(true)
            toast.success('Prontuário copiado para a área de transferência')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Falha ao copiar texto')
        }
    }

    const handleContentChange = (key: string, value: string) => {
        setContent(prev => ({ ...prev, [key]: value }))
    }

    // ProntuLink session helpers
    const addSession = (tipo: SessionTipo) => {
        const newSession: ProntuLinkSession = {
            id: crypto.randomUUID(),
            tipo,
            titulo: '',
            criado_em: new Date().toISOString(),
            ...(tipo === 'medicacao' ? { medicacoes: [] } : {}),
            ...(tipo === 'anexo' ? { anexos: [] } : {}),
        }
        setProntuLinkSessions(prev => [...prev, newSession])
    }

    const removeSession = (sessionId: string) => {
        setProntuLinkSessions(prev => prev.filter(s => s.id !== sessionId))
    }

    const updateSession = (sessionId: string, updates: Partial<ProntuLinkSession>) => {
        setProntuLinkSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s))
    }

    const updateSessionField = (sessionId: string, field: keyof ProntuLinkSession, value: unknown) => {
        updateSession(sessionId, { [field]: value } as Partial<ProntuLinkSession>)
    }

    const addMedicacao = (sessionId: string) => {
        const session = prontuLinkSessions.find(s => s.id === sessionId)
        updateSession(sessionId, {
            medicacoes: [...(session?.medicacoes || []), { nome: '', dose: '', frequencia: '', duracao: '', observacoes: '' }]
        })
    }

    const removeMedicacao = (sessionId: string, idx: number) => {
        const session = prontuLinkSessions.find(s => s.id === sessionId)
        updateSession(sessionId, { medicacoes: (session?.medicacoes || []).filter((_, i) => i !== idx) })
    }

    const updateMedicacao = (sessionId: string, idx: number, field: keyof Medicacao, value: string) => {
        const session = prontuLinkSessions.find(s => s.id === sessionId)
        updateSession(sessionId, {
            medicacoes: (session?.medicacoes || []).map((m, i) => i === idx ? { ...m, [field]: value } : m)
        })
    }

    const removeAnexoSession = (sessionId: string, idx: number) => {
        const session = prontuLinkSessions.find(s => s.id === sessionId)
        updateSession(sessionId, { anexos: (session?.anexos || []).filter((_, i) => i !== idx) })
    }

    const handleAnimalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !userId) return
        if (!file.type.startsWith('image/')) {
            toast.error('Apenas imagens são aceitas para a foto do animal.')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Imagem muito grande. Máximo de 5MB.')
            return
        }
        setIsUploadingPhoto(true)
        try {
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
            const storagePath = `${userId}/prontulink/${data.id}/photo/${fileName}`
            await uploadAttachment(file, storagePath)
            setProntuLinkPhotoUrl(storagePath)
            toast.success('Foto adicionada!')
        } catch {
            toast.error('Erro ao fazer upload da foto.')
        } finally {
            setIsUploadingPhoto(false)
            if (photoInputRef.current) photoInputRef.current.value = ''
        }
    }

    const handleSessionFileUpload = async (sessionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !userId) return
        const isImage = file.type.startsWith('image/')
        const isPDF = file.type === 'application/pdf'
        if (!isImage && !isPDF) {
            toast.error('Formato não suportado. Use imagens ou PDF.')
            return
        }
        const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error(`Arquivo muito grande. Máximo ${isImage ? '5MB' : '10MB'}.`)
            return
        }
        setUploadingSessionId(sessionId)
        try {
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
            const storagePath = `${userId}/prontulink/${data.id}/sessions/${sessionId}/${fileName}`
            await uploadAttachment(file, storagePath)
            const session = prontuLinkSessions.find(s => s.id === sessionId)
            updateSession(sessionId, {
                anexos: [...(session?.anexos || []), {
                    nome: file.name,
                    storage_path: storagePath,
                    tamanho_bytes: file.size,
                    tipo_mime: file.type
                }]
            })
            toast.success('Arquivo anexado!')
        } catch {
            toast.error('Erro ao fazer upload do arquivo.')
        } finally {
            setUploadingSessionId(null)
            if (e.target) e.target.value = ''
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch(`/api/consultations/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structured_content: content,
                    tutor_summary: tutorSummary,
                    vet_summary: vetSummary,
                    manual_notes: manualNotes,
                    animal_name: animalName,
                    animal_species: animalSpecies,
                    tutor_name: tutorName,
                    vet_display_name: vetDisplayName,
                    prontulink_clinic_name: prontuLinkClinic,
                    prontulink_animal_photo_url: prontuLinkPhotoUrl,
                    prontulink_sessions: prontuLinkSessions,
                    title: `Consulta: ${animalName || 'Animal'}`
                }),
            })

            if (!response.ok) throw new Error('Falha ao salvar')

            toast.success('Alterações salvas com sucesso!')
            setTitle(`Consulta: ${animalName || 'Animal'}`)
            setIsEditing(false)
            router.refresh()
        } catch (error) {
            toast.error('Ocorreu um erro ao salvar suas alterações.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="w-full space-y-8 animate-fade-in-up pt-4 pb-16 px-4 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Button variant="ghost" onClick={() => router.push('/history')} className="text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Histórico
                </Button>
                <div className="flex flex-wrap gap-3">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="rounded-full shadow-sm hover:bg-muted/50 transition-colors">
                                Cancelar Edição
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} className="gap-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-md shadow-teal-500/20 transition-all hover:scale-105">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar Alterações
                            </Button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            {(data.animal_id || matchingAnimal || history.length > 0) && (
                                <Sheet>
                                    <SheetTrigger 
                                        render={
                                            <Button 
                                                variant="outline" 
                                                className="rounded-full bg-teal-500/5 border-teal-500/40 text-teal-700 hover:bg-teal-500/10 hover:border-teal-500 transition-all gap-2 shadow-sm animate-pulse-soft"
                                            />
                                        }
                                    >
                                        <Activity className="w-4 h-4" />
                                        Ver Jornada Clínica
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l border-border/40 backdrop-blur-3xl bg-background/95 overflow-hidden">
                                        <div className="solid-grid-container h-full">
                                            {/* Fixed Header */}
                                            <SheetHeader className="p-6 border-b border-border/40 bg-gradient-to-br from-teal-500/5 to-transparent shrink-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-teal-500/10 rounded-lg text-teal-600">
                                                        <Activity className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <SheetTitle className="text-xl font-bold">Jornada de {animalName || 'Paciente'}</SheetTitle>
                                                        <SheetDescription>Histórico clínico completo e resumos de IA.</SheetDescription>
                                                    </div>
                                                </div>
                                            </SheetHeader>

                                            {/* Scrollable Body */}
                                            <div className="relative flex-1 min-h-0">
                                                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-background/50 to-transparent z-10 pointer-events-none"></div>
                                                <div className="h-full overflow-y-auto custom-scrollbar p-6 overscroll-contain touch-pan-y">
                                                    <TimelineView 
                                                        animalName={animalName || 'Paciente'} 
                                                        events={getFullTimeline()} 
                                                        isSidebar={true}
                                                    />
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/80 to-transparent z-10 pointer-events-none"></div>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}
                            <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-full shadow-sm border-teal-500/30 text-teal-600 hover:bg-teal-500/10 hover:border-teal-500 transition-all gap-2">
                                <FileEdit className="w-4 h-4" />
                                Editar Prontuário
                            </Button>
                        </div>
                    )}
                    <Button onClick={handleCopy} variant={copied ? "secondary" : "default"} className={`min-w-[140px] rounded-full shadow-sm transition-all gap-2 ${copied ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' : 'bg-primary hover:bg-primary/90'}`}>
                        {copied ? (
                            <><Check className="w-4 h-4" /> Copiado</>
                        ) : (
                            <><Copy className="w-4 h-4" /> Copiar Dados</>
                        )}
                    </Button>

                    {/* ProntuLink — ação direta: copia link + ação secundária WhatsApp no toast */}
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (plano !== 'platinum' && plano !== 'clinica') {
                                toast.info('ProntuLink é um recurso do plano Platinum.', {
                                    description: 'Faça upgrade para compartilhar prontuários com tutores.',
                                    action: { label: 'Ver planos', onClick: () => router.push('/assinatura') }
                                })
                                return
                            }
                            if (!data.tutor_token) {
                                toast.error('Link indisponível. Salve o prontuário e recarregue a página.')
                                return
                            }
                            const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                            const link = `${base}/acompanhe/${data.tutor_token}`
                            try {
                                await navigator.clipboard.writeText(link)
                                toast.success('ProntuLink copiado!', {
                                    description: 'Pronto para colar no WhatsApp do tutor.',
                                    action: {
                                        label: 'Abrir WhatsApp',
                                        onClick: () => {
                                            const msg = encodeURIComponent(`Olá! Segue o prontuário da consulta de ${animalName}: ${link}`)
                                            window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer')
                                        }
                                    }
                                })
                            } catch {
                                toast.error('Erro ao copiar o link.')
                            }
                        }}
                        className={`rounded-full shadow-sm gap-2 transition-all ${
                            plano === 'platinum' || plano === 'clinica'
                                ? 'border-teal-500/30 text-teal-600 hover:bg-teal-500/10 hover:border-teal-500'
                                : 'opacity-70'
                        }`}
                    >
                        {plano === 'platinum' || plano === 'clinica' ? (
                            <Share2 className="w-4 h-4" />
                        ) : (
                            <Lock className="w-4 h-4" />
                        )}
                        ProntuLink
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger 
                            render={
                                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:bg-muted/50 transition-colors" />
                            }
                        >
                            <MoreVertical className="w-5 h-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-border/40 backdrop-blur-xl p-2 min-w-[200px]">
                            <DropdownMenuItem 
                                onClick={() => router.push('/history')}
                                className="rounded-xl py-2.5 focus:bg-teal-500/10 focus:text-teal-700 cursor-pointer flex items-center gap-2"
                            >
                                <HistoryIcon className="w-4 h-4" /> Voltar ao Histórico
                            </DropdownMenuItem>
                            
                            {PDFComponents && (
                                <DropdownMenuItem className="rounded-xl py-2.5 focus:bg-teal-500/10 focus:text-teal-700 cursor-pointer">
                                    <PDFComponents.Link
                                        document={
                                            <PDFComponents.Report 
                                                data={{
                                                    title: title || 'Consulta',
                                                    created_at: data.created_at,
                                                    animal_name: (animalName || 'Animal'),
                                                    animal_species: (animalSpecies || 'Espécie'),
                                                    tutor_name: (tutorName || 'Não informado'),
                                                    structured_content: content,
                                                    vet_summary: vetSummary
                                                }} 
                                            />
                                        }
                                        fileName={`Prontuario_${animalName || 'Animal'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`}
                                        className="flex items-center gap-2 w-full"
                                    >
                                        <Download className="w-4 h-4" /> Exportar PDF
                                    </PDFComponents.Link>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="my-1 bg-border/40" />

                            <AlertDialog>
                                <AlertDialogTrigger 
                                    render={
                                        <button className="rounded-xl px-2 py-2.5 text-sm text-destructive focus:bg-destructive/10 hover:bg-destructive/10 cursor-pointer flex items-center gap-2 w-full" />
                                    }
                                >
                                    <Trash2 className="w-4 h-4" /> Excluir Registro
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-destructive/20">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold">Excluir Prontuário?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-base text-muted-foreground">
                                            Esta ação não pode ser desfeita. O prontuário de <strong>{animalName || 'este animal'}</strong> será removido permanentemente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2 sm:gap-0">
                                        <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full">
                                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                            Sim, Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Animal Recognition Banner */}
            {matchingAnimal && !isEditing && (
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500 rounded-full text-white">
                            <HistoryIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-teal-800 dark:text-teal-300">Paciente Identificado!</p>
                            <p className="text-sm text-teal-700/80 dark:text-teal-400">
                                Já atendemos um <strong>{animalName}</strong> antes. É o mesmo animal?
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button size="sm" onClick={handleImportData} className="flex-1 sm:flex-none rounded-full bg-teal-600 hover:bg-teal-700 text-white gap-2">
                            Sim, importar dados <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setMatchingAnimal(null)} className="flex-1 sm:flex-none rounded-full text-teal-700 hover:bg-teal-500/10">
                            Não, novo pet
                        </Button>
                    </div>
                </div>
            )}

            <Card className="shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden animate-fade-in-up-delay-1">
                <CardHeader className="border-b border-border/40 bg-gradient-to-br from-teal-500/5 via-blue-500/5 to-transparent px-6 sm:px-10 py-8 relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-teal-400 to-blue-500"></div>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <div className="hidden sm:flex p-4 rounded-2xl bg-background shadow-md border border-border/50 text-teal-500 shrink-0">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div className="space-y-3 w-full">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[11px] uppercase tracking-widest font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full border border-teal-500/20 shadow-sm">
                                            IA Veterinária
                                        </span>

                                        {isEditing ? (
                                            <div className="flex flex-wrap gap-2 w-full mt-2">
                                                <div className="flex-1 min-w-[200px]">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Nome do Paciente</label>
                                                    <input
                                                        type="text"
                                                        value={animalName}
                                                        onChange={e => handleAnimalNameChange(e.target.value)}
                                                        placeholder="Ex: Rex"
                                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Espécie</label>
                                                    <Select value={animalSpecies} onValueChange={(val) => setAnimalSpecies(val || '')}>
                                                        <SelectTrigger className="w-full h-9 bg-background focus:ring-teal-500">
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Canino">Canino</SelectItem>
                                                            <SelectItem value="Felino">Felino</SelectItem>
                                                            <SelectItem value="Ave">Ave</SelectItem>
                                                            <SelectItem value="Réptil">Réptil</SelectItem>
                                                            <SelectItem value="Equino">Equino</SelectItem>
                                                            <SelectItem value="Roedor">Roedor</SelectItem>
                                                            <SelectItem value="Outros">Outros</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex-1 min-w-[200px]">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Tutor</label>
                                                    <input
                                                        type="text"
                                                        value={tutorName}
                                                        onChange={e => setTutorName(e.target.value)}
                                                        placeholder="Ex: João Silva"
                                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {animalName && (
                                                    <span className="text-sm font-medium text-foreground bg-muted px-3 py-1 rounded-full border border-border flex items-center gap-2">
                                                        🐶 {animalName} {animalSpecies && <span className="text-muted-foreground">({animalSpecies})</span>}
                                                    </span>
                                                )}
                                                {tutorName && (
                                                    <span className="text-sm font-medium text-foreground bg-muted px-3 py-1 rounded-full border border-border flex items-center gap-2">
                                                        👤 Tutor: {tutorName}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {!isEditing && (
                                        <CardTitle className="text-3xl font-bold tracking-tight leading-tight text-foreground">
                                            {title || 'Consulta sem título'}
                                        </CardTitle>
                                    )}
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <CalendarCheck className="w-4 h-4 text-teal-500/70" />
                                        {new Date(data.created_at).toLocaleDateString('pt-BR', {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                        })} às {new Date(data.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {data.tags && data.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {data.tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm">
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </CardHeader>

                {/* Identity Guard Dialog/Card */}
                {isDuplicateNameDetected && isEditing && duplicateCandidate && (
                    <div className="px-10 py-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-full text-white">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-amber-800 dark:text-amber-300">Conflito de Identidade</p>
                                <p className="text-sm text-amber-700/80 dark:text-amber-400">
                                    Existe um <strong>{duplicateCandidate.name}</strong> ({duplicateCandidate.species}) com tutor(a) {duplicateCandidate.last_tutor_name || 'desconhecido'}.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button size="sm" onClick={resolveAsSamePet} className="rounded-full bg-amber-600 hover:bg-amber-700">
                                Sim, vincular histórico
                            </Button>
                            <Button size="sm" variant="ghost" onClick={resolveAsNewPet} className="rounded-full text-amber-700 hover:bg-amber-500/10">
                                Não, é outro animal
                            </Button>
                        </div>
                    </div>
                )}

                <CardContent className="p-0 bg-background/50">
                    <div className="px-6 sm:px-10 pt-6">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-1">Visão Atual</span>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-teal-600">
                                    {activeTab === 'prontuario' && <><FileText className="w-5 h-5" /> Prontuário</>}
                                    {activeTab === 'vet' && <><Stethoscope className="w-5 h-5" /> Resumo Clínico</>}
                                    {activeTab === 'prontulink' && <><Share2 className="w-5 h-5" /> Personalizar ProntuLink</>}
                                    {activeTab === 'history' && <><HistoryIcon className="w-5 h-5" /> Histórico</>}
                                    {activeTab === 'timeline' && <><Activity className="w-5 h-5" /> Trilha Clínica</>}
                                    {activeTab === 'attachments' && <><Paperclip className="w-5 h-5" /> Anexos</>}
                                </h2>
                            </div>

                            <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
                                <SheetTrigger 
                                    render={
                                        <Button 
                                            className="rounded-full px-6 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-lg shadow-teal-500/20 gap-2 border-none h-11 animate-pulse-soft"
                                        />
                                    }
                                >
                                    <Settings className="w-4 h-4" />
                                    Mudar Visualização
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[auto] max-h-[90vh] rounded-t-[3rem] border-t border-border/40 backdrop-blur-3xl bg-background/95 p-0 overflow-hidden shadow-2xl">
                                    <div className="p-8 pb-12 max-w-4xl mx-auto">
                                        <div className="text-center mb-10">
                                            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6"></div>
                                            <h3 className="text-2xl font-black tracking-tight">Centro de Comando</h3>
                                            <p className="text-muted-foreground text-sm">Escolha como deseja visualizar os dados deste atendimento.</p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { id: 'prontuario', label: 'Prontuário', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                                { id: 'vet', label: 'Resumo Clínico', icon: Stethoscope, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                                                { id: 'prontulink', label: 'ProntuLink', icon: Share2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                                { id: 'timeline', label: 'Trilha Clínica', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                                { id: 'attachments', label: 'Anexos', icon: Paperclip, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                                                { id: 'history', label: 'Histórico', icon: HistoryIcon, color: 'text-slate-500', bg: 'bg-slate-500/10' },
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setActiveTab(item.id)
                                                        setIsNavOpen(false)
                                                    }}
                                                    className={`group relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                                                        activeTab === item.id 
                                                        ? 'bg-background border-teal-500 shadow-xl shadow-teal-500/10' 
                                                        : 'bg-muted/30 border-transparent hover:bg-background hover:border-border/60 shadow-sm'
                                                    }`}
                                                >
                                                    <div className={`p-4 rounded-2xl mb-3 transition-transform group-hover:scale-110 ${item.bg} ${item.color}`}>
                                                        <item.icon className="w-7 h-7" />
                                                    </div>
                                                    <span className={`font-bold text-sm ${activeTab === item.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                        {item.label}
                                                    </span>
                                                    {activeTab === item.id && (
                                                        <div className="absolute top-3 right-3 w-2 h-2 bg-teal-500 rounded-full"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="p-6 sm:p-10">
                            <TabsContent value="prontuario" className="mt-0">
                                <div className="grid grid-cols-1 gap-6 md:gap-8">
                                    {Object.entries(content).map(([key, value], index) => {
                                        const isEmpty = !value || value.trim() === '' || value === 'Não reportado no áudio'
                                        if (isEmpty && !isEditing) return null;

                                        return (
                                            <div key={key}
                                                className="group relative bg-card rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up"
                                                style={{ animationDelay: `${(index % 10) * 50}ms` }}
                                            >
                                                <div className="absolute top-4 bottom-4 left-0 w-1 bg-teal-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="flex items-start justify-between mb-4 gap-4">
                                                    <h3 className="text-sm tracking-wider uppercase font-bold text-teal-600 dark:text-teal-500 mt-1">
                                                        {key}
                                                    </h3>
                                                    {!isEditing && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 px-2 text-xs text-muted-foreground hover:text-teal-600 hover:bg-teal-500/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all gap-1.5 -mr-2"
                                                            onClick={async () => {
                                                                try {
                                                                    await navigator.clipboard.writeText(value);
                                                                    toast.success('Texto copiado!');
                                                                } catch(e) {
                                                                    toast.error('Erro ao copiar');
                                                                }
                                                            }}
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                            Copiar
                                                        </Button>
                                                    )}
                                                </div>

                                                {isEditing ? (
                                                    <Textarea
                                                        value={value}
                                                        onChange={(e) => handleContentChange(key, e.target.value)}
                                                        className="min-h-[120px] text-base font-normal resize-y bg-background focus-visible:ring-teal-500 shadow-inner rounded-xl leading-relaxed"
                                                    />
                                                ) : (
                                                    <div className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium pl-1">
                                                        {value}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}

                                    {Object.keys(content).length === 0 && !isEditing && (
                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/60 rounded-2xl">
                                            <p>Nenhum dado estruturado extraído.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="vet" className="mt-0">
                                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Stethoscope className="w-5 h-5 text-teal-500" /> Passagem de Caso (Técnico)
                                    </h3>
                                    {isEditing ? (
                                        <Textarea
                                            value={vetSummary}
                                            onChange={(e) => setVetSummary(e.target.value)}
                                            className="min-h-[200px] text-base bg-background focus-visible:ring-teal-500 rounded-xl leading-relaxed"
                                            placeholder="Resumo técnico focado em continuidade de cuidado..."
                                        />
                                    ) : (
                                        <div className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium pt-2">
                                            {vetSummary || <span className="text-muted-foreground italic">Resumo não gerado ou vazio.</span>}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="prontulink" className="mt-0">
                                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm space-y-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                <Share2 className="w-5 h-5 text-teal-500" /> Personalizar ProntuLink
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                                                Configure o que o tutor verá no link compartilhado. Todos os campos são opcionais e editáveis.
                                            </p>
                                        </div>
                                        {data.tutor_token && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                                                    window.open(`${base}/acompanhe/${data.tutor_token}`, '_blank', 'noopener,noreferrer')
                                                }}
                                                className="rounded-full gap-2 shrink-0"
                                            >
                                                <Share2 className="w-4 h-4" /> Pré-visualizar
                                            </Button>
                                        )}
                                    </div>

                                    {/* Link validity banner */}
                                    {data.tutor_token_expires_at && (() => {
                                        const daysLeft = Math.ceil((new Date(data.tutor_token_expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                        return (
                                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border ${daysLeft <= 5 ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400' : 'bg-muted/30 border-border/30 text-muted-foreground'}`}>
                                                <Clock className="w-4 h-4 shrink-0" />
                                                {daysLeft > 0
                                                    ? `Link válido até ${new Date(data.tutor_token_expires_at!).toLocaleDateString('pt-BR')} · ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`
                                                    : 'Link expirado'
                                                }
                                            </div>
                                        )
                                    })()}

                                    {isEditing ? (
                                        <div className="space-y-6">
                                            {/* Identification */}
                                            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Identificação</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clínica / Hospital</label>
                                                        <div className="relative mt-1">
                                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <input
                                                                type="text"
                                                                value={prontuLinkClinic}
                                                                onChange={(e) => setProntuLinkClinic(e.target.value)}
                                                                placeholder="Ex: Clínica VetCare (opcional)"
                                                                maxLength={120}
                                                                className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assinatura do Veterinário</label>
                                                        <div className="relative mt-1">
                                                            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <input
                                                                type="text"
                                                                value={vetDisplayName}
                                                                onChange={(e) => setVetDisplayName(e.target.value)}
                                                                placeholder="Ex: Dr(a). Ana Souza (opcional)"
                                                                maxLength={120}
                                                                className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                                            />
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-1">Aparece no cabeçalho do link.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Animal Photo */}
                                            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                    <Camera className="w-3.5 h-3.5" /> Foto do Animal
                                                </h4>
                                                <div className="flex items-center gap-4">
                                                    {prontuLinkPhotoUrl ? (
                                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/60 shadow-sm shrink-0">
                                                            <img
                                                                src={`/api/prontulink-asset?token=${data.tutor_token}&path=${encodeURIComponent(prontuLinkPhotoUrl)}`}
                                                                alt="Foto do animal"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <button
                                                                onClick={() => setProntuLinkPhotoUrl('')}
                                                                className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                                                            <Camera className="w-8 h-8 opacity-40" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1.5">
                                                        <input
                                                            ref={photoInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleAnimalPhotoUpload}
                                                            disabled={isUploadingPhoto}
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => photoInputRef.current?.click()}
                                                            disabled={isUploadingPhoto}
                                                            className="rounded-full gap-2"
                                                        >
                                                            {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                                            {prontuLinkPhotoUrl ? 'Trocar Foto' : 'Adicionar Foto'}
                                                        </Button>
                                                        <p className="text-[11px] text-muted-foreground">JPG ou PNG · máx 5MB (opcional)</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Message */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mensagem para o Tutor</label>
                                                <Textarea
                                                    value={tutorSummary}
                                                    onChange={(e) => setTutorSummary(e.target.value)}
                                                    className="mt-1 min-h-[160px] text-base bg-background focus-visible:ring-teal-500 rounded-xl leading-relaxed"
                                                    placeholder={`Olá, ${tutorName || '[tutor]'}!\n\nSegue o resumo da consulta de ${animalName || '[paciente]'}:\n\n• Diagnóstico: ...\n• Próximos passos: ...\n\nQualquer dúvida, estou à disposição.`}
                                                />
                                            </div>

                                            {/* Sessions */}
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sessões Clínicas</h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <Button type="button" variant="outline" size="sm" onClick={() => addSession('mensagem')} className="rounded-full gap-1.5 h-8 text-xs">
                                                            <MessageSquare className="w-3.5 h-3.5 text-teal-500" /> Mensagem
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => addSession('medicacao')} className="rounded-full gap-1.5 h-8 text-xs">
                                                            <Pill className="w-3.5 h-3.5 text-blue-500" /> Medicação
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => addSession('exame')} className="rounded-full gap-1.5 h-8 text-xs">
                                                            <Microscope className="w-3.5 h-3.5 text-purple-500" /> Exame
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => addSession('anexo')} className="rounded-full gap-1.5 h-8 text-xs">
                                                            <Paperclip className="w-3.5 h-3.5 text-orange-500" /> Anexo
                                                        </Button>
                                                    </div>
                                                </div>

                                                {prontuLinkSessions.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-6 italic bg-muted/20 rounded-xl border border-dashed border-border/40">
                                                        Nenhuma sessão adicionada. Use "Adicionar" para incluir medicações, exames, mensagens ou anexos.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {prontuLinkSessions.map((session) => (
                                                            <div key={session.id} className="border border-border/60 rounded-xl overflow-hidden">
                                                                <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                                                                    <div className="flex items-center gap-2">
                                                                        {session.tipo === 'mensagem' && <MessageSquare className="w-4 h-4 text-teal-500" />}
                                                                        {session.tipo === 'medicacao' && <Pill className="w-4 h-4 text-blue-500" />}
                                                                        {session.tipo === 'exame' && <Microscope className="w-4 h-4 text-purple-500" />}
                                                                        {session.tipo === 'anexo' && <Paperclip className="w-4 h-4 text-orange-500" />}
                                                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                            {session.tipo === 'mensagem' && 'Mensagem'}
                                                                            {session.tipo === 'medicacao' && 'Medicações'}
                                                                            {session.tipo === 'exame' && 'Exame'}
                                                                            {session.tipo === 'anexo' && 'Anexo'}
                                                                        </span>
                                                                    </div>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeSession(session.id)}>
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                                <div className="p-4 space-y-3">
                                                                    <input
                                                                        type="text"
                                                                        value={session.titulo}
                                                                        onChange={(e) => updateSessionField(session.id, 'titulo', e.target.value)}
                                                                        placeholder="Título (opcional)"
                                                                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                                                    />
                                                                    {session.tipo === 'mensagem' && (
                                                                        <Textarea
                                                                            value={session.conteudo || ''}
                                                                            onChange={(e) => updateSessionField(session.id, 'conteudo', e.target.value)}
                                                                            placeholder="Escreva a mensagem..."
                                                                            className="min-h-[100px] bg-background focus-visible:ring-teal-500 rounded-xl"
                                                                        />
                                                                    )}
                                                                    {session.tipo === 'exame' && (
                                                                        <div className="space-y-2">
                                                                            <Textarea
                                                                                value={session.conteudo || ''}
                                                                                onChange={(e) => updateSessionField(session.id, 'conteudo', e.target.value)}
                                                                                placeholder="Descrição do exame / Solicitação..."
                                                                                className="min-h-[80px] bg-background focus-visible:ring-teal-500 rounded-xl"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                value={session.resultado || ''}
                                                                                onChange={(e) => updateSessionField(session.id, 'resultado', e.target.value)}
                                                                                placeholder="Resultado / Interpretação (opcional)"
                                                                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {session.tipo === 'medicacao' && (
                                                                        <div className="space-y-2">
                                                                            {(session.medicacoes || []).map((med, mi) => (
                                                                                <div key={mi} className="p-3 bg-muted/30 rounded-lg border border-border/30 space-y-2">
                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                        <input placeholder="Nome do medicamento *" value={med.nome} onChange={(e) => updateMedicacao(session.id, mi, 'nome', e.target.value)} className="sm:col-span-2 h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500" />
                                                                                        <input placeholder="Dose (ex: 500mg)" value={med.dose} onChange={(e) => updateMedicacao(session.id, mi, 'dose', e.target.value)} className="h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500" />
                                                                                        <input placeholder="Frequência (ex: 2x ao dia)" value={med.frequencia} onChange={(e) => updateMedicacao(session.id, mi, 'frequencia', e.target.value)} className="h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500" />
                                                                                        <input placeholder="Duração (ex: 7 dias)" value={med.duracao} onChange={(e) => updateMedicacao(session.id, mi, 'duracao', e.target.value)} className="h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500" />
                                                                                        <input placeholder="Observações" value={med.observacoes} onChange={(e) => updateMedicacao(session.id, mi, 'observacoes', e.target.value)} className="sm:col-span-2 h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500" />
                                                                                    </div>
                                                                                    <button onClick={() => removeMedicacao(session.id, mi)} className="text-xs text-destructive hover:underline">Remover medicamento</button>
                                                                                </div>
                                                                            ))}
                                                                            <Button variant="outline" size="sm" onClick={() => addMedicacao(session.id)} className="w-full rounded-lg gap-1.5 h-8">
                                                                                <Plus className="w-3.5 h-3.5" /> Adicionar Medicamento
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                    {session.tipo === 'anexo' && (
                                                                        <div className="space-y-2">
                                                                            {(session.anexos || []).map((anexo, ai) => (
                                                                                <div key={ai} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/30">
                                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                                                                        <span className="text-sm truncate">{anexo.nome}</span>
                                                                                        <span className="text-xs text-muted-foreground shrink-0">({Math.round(anexo.tamanho_bytes / 1024)}KB)</span>
                                                                                    </div>
                                                                                    <button onClick={() => removeAnexoSession(session.id, ai)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2">
                                                                                        <X className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                            <label
                                                                                htmlFor={`session-file-${session.id}`}
                                                                                className={`flex flex-col items-center gap-1.5 p-4 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-teal-500/40 transition-colors ${uploadingSessionId === session.id ? 'opacity-50 pointer-events-none' : ''}`}
                                                                            >
                                                                                {uploadingSessionId === session.id ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <UploadCloud className="w-5 h-5 text-muted-foreground" />}
                                                                                <p className="text-xs text-muted-foreground">Imagem (máx 5MB) ou PDF (máx 10MB)</p>
                                                                            </label>
                                                                            <input type="file" id={`session-file-${session.id}`} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleSessionFileUpload(session.id, e)} disabled={!!uploadingSessionId} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div className="space-y-4 pt-2">
                                            <div className="flex flex-wrap gap-2">
                                                {prontuLinkClinic && (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-700 dark:text-blue-400">
                                                        <Building2 className="w-3.5 h-3.5" /> {prontuLinkClinic}
                                                    </div>
                                                )}
                                                {vetDisplayName && (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-sm font-medium text-teal-700 dark:text-teal-400">
                                                        <Stethoscope className="w-3.5 h-3.5" /> {vetDisplayName}
                                                    </div>
                                                )}
                                            </div>
                                            {prontuLinkPhotoUrl && (
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={`/api/prontulink-asset?token=${data.tutor_token}&path=${encodeURIComponent(prontuLinkPhotoUrl)}`}
                                                        alt={`Foto de ${animalName}`}
                                                        className="w-16 h-16 rounded-xl object-cover border border-border/60 shadow-sm"
                                                    />
                                                    <span className="text-sm text-muted-foreground">Foto de {animalName || 'animal'}</span>
                                                </div>
                                            )}
                                            <div className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium min-h-[60px]">
                                                {tutorSummary || <span className="text-muted-foreground italic">Nenhuma mensagem. Clique em &quot;Editar Prontuário&quot; para adicionar.</span>}
                                            </div>
                                            {prontuLinkSessions.length > 0 && (
                                                <div className="space-y-2 pt-3 border-t border-border/30">
                                                    <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{prontuLinkSessions.length} sess{prontuLinkSessions.length !== 1 ? 'ões' : 'ão'}</p>
                                                    {prontuLinkSessions.map(session => (
                                                        <div key={session.id} className="flex items-center gap-2 p-3 bg-muted/20 rounded-xl border border-border/30">
                                                            {session.tipo === 'mensagem' && <MessageSquare className="w-4 h-4 text-teal-500 shrink-0" />}
                                                            {session.tipo === 'medicacao' && <Pill className="w-4 h-4 text-blue-500 shrink-0" />}
                                                            {session.tipo === 'exame' && <Microscope className="w-4 h-4 text-purple-500 shrink-0" />}
                                                            {session.tipo === 'anexo' && <Paperclip className="w-4 h-4 text-orange-500 shrink-0" />}
                                                            <span className="text-sm font-medium">{session.titulo || 'Sem título'}</span>
                                                            {session.tipo === 'medicacao' && (session.medicacoes?.length ?? 0) > 0 && (
                                                                <span className="text-xs text-muted-foreground ml-auto">{session.medicacoes!.length} medicamento{session.medicacoes!.length !== 1 ? 's' : ''}</span>
                                                            )}
                                                            {session.tipo === 'anexo' && (session.anexos?.length ?? 0) > 0 && (
                                                                <span className="text-xs text-muted-foreground ml-auto">{session.anexos!.length} arquivo{session.anexos!.length !== 1 ? 's' : ''}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {!prontuLinkClinic && !vetDisplayName && !tutorSummary && prontuLinkSessions.length === 0 && !prontuLinkPhotoUrl && (
                                                <span className="text-muted-foreground italic text-sm">Nenhum conteúdo personalizado. Clique em &quot;Editar Prontuário&quot; para configurar.</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Manual Notes Section - Visible on all tabs at the bottom */}
                            <div className="mt-12 pt-8 border-t border-border/40">
                                <h3 className="text-lg font-bold text-foreground mb-4 pl-1">Anotações Manuais</h3>
                                {isEditing ? (
                                    <Textarea
                                        value={manualNotes}
                                        onChange={e => setManualNotes(e.target.value)}
                                        placeholder="Adicione observações, lembretes ou informações não captadas pelo áudio..."
                                        className="min-h-[120px] bg-background focus-visible:ring-teal-500 shadow-inner rounded-xl p-4 text-base"
                                    />
                                ) : (
                                    <div className="p-5 bg-muted/30 rounded-xl border border-border/50 text-foreground/80 min-h-[100px] whitespace-pre-wrap leading-relaxed font-medium">
                                        {manualNotes || <span className="text-muted-foreground italic text-sm">Nenhuma anotação extra. Clique em "Editar Prontuário" para adicionar.</span>}
                                    </div>
                                )}
                            </div>

                            <TabsContent value="attachments" className="mt-0 space-y-8">
                                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                        <Paperclip className="w-5 h-5 text-teal-500" /> Gerenciar Anexos
                                    </h3>
                                    
                                    {isMounted && (
                                        <div className="flex flex-wrap items-center gap-3 mb-6">
                                            {/* PDF export and Delete moved to Main Options Menu */}
                                            <p className="text-sm text-muted-foreground italic bg-muted/40 px-4 py-2 rounded-xl border border-border/40">
                                                Use o menu de opções no topo para exportar ou excluir este prontuário.
                                            </p>
                                        </div>
                                    )}

                                    {userId && (
                                        <div className="space-y-10">
                                            <AttachmentZone 
                                                consultaId={data.id}
                                                animalId={data.animal_id || matchingAnimal?.id}
                                                userId={userId}
                                                onUploadSuccess={() => setRefreshAttachments(prev => prev + 1)}
                                            />
                                            
                                            <div className="pt-6 border-t border-border/40">
                                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Arquivos da Consulta</h4>
                                                <AttachmentList 
                                                    consultaId={data.id} 
                                                    refreshKey={refreshAttachments} 
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="timeline" className="mt-0 outline-none">
                                <div className="px-1 pt-2">
                                    <TimelineView 
                                        animalName={animalName || 'Paciente'} 
                                        events={getFullTimeline()} 
                                                    />
                                                </div>
                                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>

                {isEditing && (
                    <CardFooter className="bg-muted/30 border-t border-border/50 p-6 sm:px-10 flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="rounded-full bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md hover:scale-105 transition-all text-base px-8 h-12">
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            Salvar Modificações
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
