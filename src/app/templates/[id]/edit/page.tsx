'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, FileEdit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function EditTemplatePage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter()
    const [name, setName] = useState('')
    const [content, setContent] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function fetchTemplate() {
            try {
                const { data, error } = await supabase
                    .from('consultation_templates')
                    .select('*')
                    .eq('id', params.id)
                    .single()

                if (error) throw error
                if (!data) throw new Error('Modelo não encontrado')

                setName(data.name)
                setContent(data.content)
            } catch (error) {
                console.error('Error fetching template:', error)
                toast.error('Não foi possível carregar o modelo.')
                router.push('/dashboard')
            } finally {
                setIsLoading(false)
            }
        }

        fetchTemplate()
    }, [params.id, router, supabase])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !content.trim()) {
            toast.error('Preencha o nome e o modelo do prontuário.')
            return
        }

        setIsSaving(true)

        try {
            const { error } = await supabase
                .from('consultation_templates')
                .update({
                    name: name.trim(),
                    content: content.trim(),
                })
                .eq('id', params.id)

            if (error) {
                console.error("Supabase error updating template:", error);
                throw new Error(error.message || JSON.stringify(error));
            }

            toast.success('Modelo atualizado com sucesso!')
            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            console.error('Error updating template:', error)
            toast.error(error.message ? `Erro: ${error.message}` : 'Ocorreu um erro ao atualizar o modelo.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('consultation_templates')
                .delete()
                .eq('id', params.id)

            if (error) throw error

            toast.success('Modelo excluído com sucesso!')
            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            console.error('Error deleting template:', error)
            toast.error('Ocorreu um erro ao excluir o modelo.')
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="flex-1 w-full max-w-3xl mx-auto pt-4 pb-12 space-y-6 animate-fade-in-up px-4">
            <div>
                <Link href="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted/50 hover:text-foreground h-10 px-4 py-2 mb-2 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Início
                </Link>
            </div>

            <Card className="shadow-2xl border-amber-500/20 bg-background/80 backdrop-blur-xl animate-fade-in-up-delay-1">
                <form onSubmit={handleSave}>
                    <CardHeader className="bg-gradient-to-b from-amber-500/5 to-transparent border-b border-border/40 pb-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/30 rounded-2xl flex items-center justify-center mb-5 animate-float">
                                    <FileEdit className="w-7 h-7 text-white" />
                                </div>
                                <CardTitle className="text-3xl font-bold tracking-tight">Editar Modelo</CardTitle>
                                <CardDescription className="text-base font-medium mt-1">
                                    Modifique a estrutura requerida pela IA para este prontuário.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="mt-2 rounded-full shadow-md hover:scale-105 transition-all"
                                onClick={handleDelete}
                                disabled={isDeleting || isSaving}
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Excluir
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-8 px-6 sm:px-8">
                        <div className="space-y-3">
                            <label htmlFor="name" className="text-sm font-semibold text-foreground tracking-tight">
                                Nome do Modelo
                            </label>
                            <Input
                                id="name"
                                placeholder="Ex: Avaliação Inicial - Clínico Geral (Cães)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-base font-medium h-12 bg-background/50 focus-visible:ring-amber-500 transition-shadow"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col space-y-1.5">
                                <label htmlFor="content" className="text-sm font-semibold text-foreground tracking-tight">
                                    Estrutura do Prontuário
                                </label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    A IA usará os tópicos delineados abaixo como as <strong>chaves exatas</strong> de preenchimento. Seja claro nos termos.
                                </p>
                            </div>
                            <Textarea
                                id="content"
                                placeholder="Insira a sua estrutura desejada aqui..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[400px] text-sm font-mono leading-relaxed bg-background/50 focus-visible:ring-amber-500 shadow-inner resize-y p-4"
                                required
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="bg-muted/30 border-t border-border/40 py-5 px-6 sm:px-8 flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" className="rounded-full hover:bg-muted/50" onClick={() => router.push('/dashboard')} disabled={isSaving || isDeleting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving || isDeleting} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 min-w-[150px] rounded-full transition-all duration-300 hover:scale-[1.02]">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Atualizar Modelo
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
