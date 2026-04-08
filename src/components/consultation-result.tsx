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
    CalendarCheck, FileEdit, Tag, Stethoscope, User,
    Trash2, AlertTriangle, History as HistoryIcon, ArrowRight,
    Paperclip, Download, Activity, MoreVertical, Settings
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
import dynamic from 'next/dynamic'
import { TimelineView } from './timeline-view'

// Note: PDF library is loaded inside the component's useEffect to avoid SSR/Hydration issues
// specifically related to dynamic() which can cause 'su is not a function' in React 19.

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
    const [animalName, setAnimalName] = useState(data.animals?.name || '')
    const [animalSpecies, setAnimalSpecies] = useState(data.animals?.species || '')
    const [tutorName, setTutorName] = useState(data.tutor_name || '')

    // History and Matching States
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [matchingAnimal, setMatchingAnimal] = useState<AnimalMatch | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [refreshAttachments, setRefreshAttachments] = useState(0)
    const [isMounted, setIsMounted] = useState(false)
    const [PDFComponents, setPDFComponents] = useState<PDFLib | null>(null)
    const [isDuplicateNameDetected, setIsDuplicateNameDetected] = useState(false)
    const [duplicateCandidate, setDuplicateCandidate] = useState<AnimalMatch | null>(null)
    const [activeTab, setActiveTab] = useState('prontuario')
    const [isNavOpen, setIsNavOpen] = useState(false)
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null)

    useEffect(() => {
        setIsMounted(true)
        
        // Asynchronously load PDF libraries only on the client
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
        
        const getUserId = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)
        }
        getUserId()
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
                                    {activeTab === 'tutor' && <><User className="w-5 h-5" /> Resumo Tutor</>}
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
                                                { id: 'tutor', label: 'Resumo Tutor', icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
                                                <h3 className="text-sm tracking-wider uppercase font-bold text-teal-600 dark:text-teal-500 mb-4 flex items-center gap-2">
                                                    {key}
                                                </h3>

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

                            <TabsContent value="tutor" className="mt-0">
                                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-teal-500" /> Resumo para o Tutor (Amigável)
                                    </h3>
                                    {isEditing ? (
                                        <Textarea
                                            value={tutorSummary}
                                            onChange={(e) => setTutorSummary(e.target.value)}
                                            className="min-h-[200px] text-base bg-background focus-visible:ring-teal-500 rounded-xl leading-relaxed"
                                            placeholder="Resumo com linguagem clara, direta e empática..."
                                        />
                                    ) : (
                                        <div className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium pt-2">
                                            {tutorSummary || <span className="text-muted-foreground italic">Resumo não gerado ou vazio.</span>}
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
