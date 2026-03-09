'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Save, Copy, Check, ArrowLeft, Loader2, FileText, CalendarCheck, FileEdit } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ConsultationData {
    id: string
    title: string
    mode: 'human' | 'vet'
    structured_content: Record<string, string>
    created_at: string
}

export function ConsultationResult({ data }: { data: ConsultationData }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [content, setContent] = useState<Record<string, string>>(data.structured_content || {})

    // Format content as plain text for copying
    const formattedText = Object.entries(content)
        .filter(([_, value]) => value && value.trim() !== '' && value !== 'Não reportado no áudio')
        .map(([key, value]) => `# ${key}\n${value}`)
        .join('\n\n')

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formattedText)
            setCopied(true)
            toast.success('Texto copiado para a área de transferência')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Falha ao copiar texto')
        }
    }

    const handleContentChange = (key: string, value: string) => {
        setContent(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch(`/api/consultations/${data.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ structured_content: content }),
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
                            <Button onClick={handleSave} disabled={isSaving} className="gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-105">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar Alterações
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-full shadow-sm border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500 transition-all gap-2">
                            <FileEdit className="w-4 h-4" />
                            Editar Prontuário
                        </Button>
                    )}
                    <Button onClick={handleCopy} variant={copied ? "secondary" : "default"} className={`min-w-[140px] rounded-full shadow-sm transition-all gap-2 ${copied ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' : 'bg-primary hover:bg-primary/90'}`}>
                        {copied ? (
                            <><Check className="w-4 h-4" /> Copiado com sucesso</>
                        ) : (
                            <><Copy className="w-4 h-4" /> Copiar Prontuário</>
                        )}
                    </Button>
                </div>
            </div>

            <Card className="shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden animate-fade-in-up-delay-1">
                <CardHeader className="border-b border-border/40 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent px-6 sm:px-10 py-8 relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <div className="hidden sm:flex p-4 rounded-2xl bg-background shadow-md border border-border/50 text-amber-500 shrink-0">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2">
                                    <span className="text-[11px] uppercase tracking-widest font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 shadow-sm">
                                        Prontuário Veterinário Gerado por IA
                                    </span>
                                </div>
                                <CardTitle className="text-3xl font-bold tracking-tight leading-tight text-foreground">
                                    {data.title || 'Consulta sem título'}
                                </CardTitle>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <CalendarCheck className="w-4 h-4 text-amber-500/70" />
                                    {new Date(data.created_at).toLocaleDateString('pt-BR', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })} às {new Date(data.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-10 bg-background/50">
                    <div className="grid grid-cols-1 gap-6 md:gap-8">
                        {Object.entries(content).map(([key, value], index) => {
                            // Exibir apenas se tiver conteúdo, ou se estiver em modo de edição
                            const isEmpty = !value || value.trim() === '' || value === 'Não reportado no áudio'
                            if (isEmpty && !isEditing) return null;

                            return (
                                <div key={key}
                                    className="group relative bg-card rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up"
                                    style={{ animationDelay: `${(index % 10) * 50}ms` }}
                                >
                                    {/* Decorative subtle left border on hover */}
                                    <div className="absolute top-4 bottom-4 left-0 w-1 bg-amber-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <h3 className="text-sm tracking-wider uppercase font-bold text-amber-600 dark:text-amber-500 mb-4 flex items-center gap-2">
                                        {key}
                                    </h3>

                                    {isEditing ? (
                                        <Textarea
                                            value={value}
                                            onChange={(e) => handleContentChange(key, e.target.value)}
                                            className="min-h-[120px] text-base font-normal resize-y bg-background focus-visible:ring-amber-500 shadow-inner rounded-xl leading-relaxed"
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
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Nenhum dado estruturado foi extraído desta consulta.</p>
                            </div>
                        )}
                    </div>
                </CardContent>

                {isEditing && (
                    <CardFooter className="bg-muted/30 border-t border-border/50 p-6 sm:px-10 flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:scale-105 transition-all text-base px-8 h-12">
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            Salvar Alterações no Prontuário
                        </Button>
                    </CardFooter>
                )}
            </Card>

            {!isEditing && (
                <div className="flex justify-center pt-8 pb-4 animate-fade-in-up-delay-2">
                    <p className="text-center text-sm font-medium text-muted-foreground bg-muted/50 px-6 py-3 rounded-full border border-border/50 shadow-sm max-w-2xl">
                        <span className="text-amber-500 mr-2">⚠️</span> Este documento foi gerado por Inteligência Artificial. Sempre revise cuidadosamente o conteúdo clínico antes de utilizá-lo oficialmente.
                    </p>
                </div>
            )}
        </div>
    )
}
