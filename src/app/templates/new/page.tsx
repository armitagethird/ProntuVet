'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, Dog } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_TEMPLATE = ``

export default function NewTemplatePage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [content, setContent] = useState(DEFAULT_TEMPLATE)
    const [isSaving, setIsSaving] = useState(false)
    const supabase = createClient()

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !content.trim()) {
            toast.error('Preencha o nome e o modelo do prontuário.')
            return
        }

        setIsSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Você precisa estar logado.')
                router.push('/login')
                return
            }

            const { error } = await supabase
                .from('consultation_templates')
                .insert({
                    user_id: user.id,
                    name: name.trim(),
                    content: content.trim(),
                    is_system_default: false
                })

            if (error) {
                console.error("Supabase error inserting template:", error);
                throw new Error(error.message || JSON.stringify(error));
            }

            toast.success('Modelo criado com sucesso!')
            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            console.error('Error saving template:', error)
            toast.error(error.message ? `Erro: ${error.message}` : 'Ocorreu um erro ao salvar o modelo.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex-1 w-full max-w-3xl mx-auto pt-4 pb-12 space-y-6 animate-fade-in-up px-4">
            <div>
                <Link href="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted/50 hover:text-foreground h-10 px-4 py-2 mb-2 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Início
                </Link>
            </div>

            <Card className="shadow-2xl border-teal-500/20 bg-background/80 backdrop-blur-xl animate-fade-in-up-delay-1">
                <form onSubmit={handleSave}>
                    <CardHeader className="bg-gradient-to-b from-teal-500/5 to-transparent border-b border-border/40 pb-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-blue-600 shadow-lg shadow-teal-500/30 rounded-2xl flex items-center justify-center mb-5 animate-float">
                                    <Dog className="w-7 h-7 text-white" />
                                </div>
                                <CardTitle className="text-3xl font-bold tracking-tight">Novo Modelo</CardTitle>
                                <CardDescription className="text-base font-medium mt-1 pr-4">
                                    Crie a estrutura exata que a inteligência artificial deve preencher após ouvir a consulta.
                                </CardDescription>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                                <Button type="button" variant="outline" className="rounded-full shadow-sm w-full md:w-auto" onClick={() => router.push('/dashboard')} disabled={isSaving}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-md shadow-teal-500/20 rounded-full transition-all duration-300 hover:scale-[1.02] w-full md:w-auto">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Salvar Modelo
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-8 px-6 sm:px-8 pb-8">
                        <div className="space-y-3">
                            <label htmlFor="name" className="text-sm font-semibold text-foreground tracking-tight">
                                Nome do Modelo
                            </label>
                            <Input
                                id="name"
                                placeholder="Ex: Avaliação Inicial - Clínico Geral (Cães)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-base font-medium h-12 bg-background/50 focus-visible:ring-teal-500 transition-shadow"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col space-y-1.5">
                                <label htmlFor="content" className="text-sm font-semibold text-foreground tracking-tight">
                                    Estrutura Requerida
                                </label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    A IA usará os tópicos delineados abaixo como as <strong>chaves exatas</strong> de preenchimento. Seja claro nos termos (Ex: "Frequência Cardíaca:", "Diagnóstico Diferencial:").
                                </p>
                            </div>
                            <Textarea
                                id="content"
                                placeholder="Insira a sua estrutura desejada aqui..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[220px] max-h-[400px] text-sm font-mono leading-relaxed bg-background/50 focus-visible:ring-teal-500 shadow-inner resize-y p-4"
                                required
                            />
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}
