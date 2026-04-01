'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Copy, Check, ArrowLeft, Loader2, FileText, CalendarCheck, FileEdit, Tag, Stethoscope, User } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export function ConsultationResult({ data }: { data: ConsultationData }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    // States for editable fields
    const [content, setContent] = useState<Record<string, string>>(data.structured_content || {})
    const [tutorSummary, setTutorSummary] = useState(data.tutor_summary || '')
    const [vetSummary, setVetSummary] = useState(data.vet_summary || '')
    const [manualNotes, setManualNotes] = useState(data.manual_notes || '')

    // New states for header editing
    const [animalName, setAnimalName] = useState(data.animals?.name || '')
    const [animalSpecies, setAnimalSpecies] = useState(data.animals?.species || '')
    const [tutorName, setTutorName] = useState(data.tutor_name || '')

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
                    tutor_name: tutorName
                }),
            })

            if (!response.ok) throw new Error('Falha ao salvar')

            toast.success('Alterações salvas com sucesso!')
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
                        <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-full shadow-sm border-teal-500/30 text-teal-600 hover:bg-teal-500/10 hover:border-teal-500 transition-all gap-2">
                            <FileEdit className="w-4 h-4" />
                            Editar Prontuário
                        </Button>
                    )}
                    <Button onClick={handleCopy} variant={copied ? "secondary" : "default"} className={`min-w-[140px] rounded-full shadow-sm transition-all gap-2 ${copied ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' : 'bg-primary hover:bg-primary/90'}`}>
                        {copied ? (
                            <><Check className="w-4 h-4" /> Copiado</>
                        ) : (
                            <><Copy className="w-4 h-4" /> Copiar Dados</>
                        )}
                    </Button>
                </div>
            </div>

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
                                                        onChange={e => setAnimalName(e.target.value)}
                                                        placeholder="Ex: Rex"
                                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Espécie</label>
                                                    <input
                                                        type="text"
                                                        value={animalSpecies}
                                                        onChange={e => setAnimalSpecies(e.target.value)}
                                                        placeholder="Ex: Canino"
                                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                                    />
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
                                            {data.title || 'Consulta sem título'}
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

                <CardContent className="p-0 bg-background/50">
                    <Tabs defaultValue="prontuario" className="w-full">
                        <div className="px-6 sm:px-10 pt-6">
                            <TabsList className="bg-muted/50 p-1 rounded-xl inline-flex w-full overflow-x-auto justify-start sm:w-auto overflow-y-hidden shrink-0">
                                <TabsTrigger value="prontuario" className="rounded-lg px-4 py-2 font-medium flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap">
                                    <FileText className="w-4 h-4" /> Prontuário Completo
                                </TabsTrigger>
                                {(vetSummary || isEditing) && (
                                    <TabsTrigger value="vet" className="rounded-lg px-4 py-2 font-medium flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap">
                                        <Stethoscope className="w-4 h-4" /> Resumo Clínico
                                    </TabsTrigger>
                                )}
                                {(tutorSummary || isEditing) && (
                                    <TabsTrigger value="tutor" className="rounded-lg px-4 py-2 font-medium flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap">
                                        <User className="w-4 h-4" /> Resumo para Tutor
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

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
