'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Image as ImageIcon, ExternalLink, Trash2, Loader2, Maximize2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'

interface Attachment {
    id: string
    nome_arquivo: string
    tipo: 'imagem' | 'exame'
    storage_path: string
    criado_em: string
    size?: number
}

export function AttachmentList({ consultaId, refreshKey }: { consultaId: string, refreshKey: number }) {
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchAttachments = async () => {
            setIsLoading(true)
            try {
                const { data, error } = await supabase
                    .from('anexos_consulta')
                    .select('*')
                    .eq('consulta_id', consultaId)
                    .order('criado_em', { ascending: false })

                if (error) throw error
                setAttachments(data || [])
            } catch (err) {
                console.error('Fetch error:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAttachments()
    }, [consultaId, refreshKey, supabase])

    const getSignedUrlAndOpen = async (path: string, isImage = false) => {
        const { data, error } = await supabase.storage.from('medical-attachments').createSignedUrl(path, 3600)
        if (error) {
            toast.error('Erro ao abrir arquivo.')
            return
        }
        
        if (isImage) {
            setSelectedImage(data.signedUrl)
        } else {
            window.open(data.signedUrl, '_blank')
        }
    }

    const handleDelete = async (id: string, storagePath: string) => {
        if (!confirm('Tem certeza que deseja excluir este anexo?')) return

        try {
            // 1. Delete from storage
            await supabase.storage.from('medical-attachments').remove([storagePath])
            
            // 2. Delete from DB
            const { error } = await supabase.from('anexos_consulta').delete().eq('id', id)
            if (error) throw error

            setAttachments(prev => prev.filter(a => a.id !== id))
            toast.success('Anexo removido.')
        } catch (err) {
            toast.error('Erro ao excluir.')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
        )
    }

    if (attachments.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/10 rounded-3xl border border-dashed border-border/40">
                <p className="text-muted-foreground">Nenhum anexo clínico para esta consulta.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {attachments.map((file) => (
                <div key={file.id} className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-teal-500/30 transition-all">
                    {/* Thumbnail View */}
                    <div 
                        onClick={() => getSignedUrlAndOpen(file.storage_path, file.tipo === 'imagem')}
                        className="aspect-square flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                        {file.tipo === 'imagem' ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 rounded-full bg-teal-500/10 text-teal-600">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-teal-600">IMAGEM CLÍNICA</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 rounded-full bg-blue-500/10 text-blue-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase">LAUDO PDF</span>
                            </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-3 text-center line-clamp-1 px-2">
                            {file.nome_arquivo}
                        </p>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                            variant="destructive"
                            size="icon"
                            className="w-7 h-7 rounded-lg"
                            onClick={() => handleDelete(file.id, file.storage_path)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}

            {/* Image Preview Modal */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
                    <DialogHeader className="p-4 bg-muted/80 backdrop-blur-md flex-row justify-between items-center rounded-t-3xl">
                        <DialogTitle className="text-foreground">Visualização Clínica</DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedImage(null)} className="text-foreground rounded-full h-8 w-8">
                            <X className="w-4 h-4" />
                        </Button>
                    </DialogHeader>
                    {selectedImage && (
                        <div className="relative animate-zoom-in">
                            <img 
                                src={selectedImage} 
                                alt="Anexo Clínico" 
                                className="w-full h-auto max-h-[85vh] object-contain rounded-b-3xl bg-black/10"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
