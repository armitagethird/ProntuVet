'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadCloud, FileText, Image as ImageIcon, Loader2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { uploadAttachment } from '@/lib/storage-client'
import { createClient } from '@/lib/supabase/client'

interface AttachmentZoneProps {
    consultaId: string
    animalId?: string
    userId: string
    onUploadSuccess: () => void
}

export function AttachmentZone({ consultaId, animalId, userId, onUploadSuccess }: AttachmentZoneProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        const file = files[0]
        
        // Basic validation
        const isImage = file.type.startsWith('image/')
        const isPDF = file.type === 'application/pdf'
        
        if (!isImage && !isPDF) {
            toast.error('Formato não suportado. Use Imagens ou PDF.')
            setIsUploading(false)
            return
        }

        const maxSize = isImage ? 10 * 1024 * 1024 : 20 * 1024 * 1024 // 10MB or 20MB
        if (file.size > maxSize) {
            toast.error(`Arquivo muito grande. Máximo de ${isImage ? '10MB' : '20MB'}.`)
            setIsUploading(false)
            return
        }

        try {
            const typeDir = isImage ? 'imagens' : 'exames'
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
            const storagePath = `${userId}/${animalId || 'unknown'}/${consultaId}/${typeDir}/${fileName}`

            // 1. Upload to Storage
            await uploadAttachment(file, storagePath)

            // 2. Save metadata to DB
            const { error: dbError } = await supabase
                .from('anexos_consulta')
                .insert({
                    consulta_id: consultaId,
                    user_id: userId,
                    tipo: isImage ? 'imagem' : 'exame',
                    nome_arquivo: file.name,
                    storage_path: storagePath,
                    tamanho_bytes: file.size
                })

            if (dbError) throw dbError

            toast.success('Arquivo anexado com sucesso!')
            onUploadSuccess()
            
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Erro ao fazer upload do arquivo.')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`relative group border-2 border-dashed border-border/60 hover:border-teal-500/50 rounded-3xl p-8 transition-all cursor-pointer bg-card/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*,application/pdf"
                />
                
                <div className="p-4 rounded-2xl bg-teal-500/10 text-teal-600 group-hover:scale-110 transition-transform">
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                        <UploadCloud className="w-8 h-8" />
                    )}
                </div>

                <div className="text-center">
                    <p className="font-bold text-foreground">Novo Anexo Clínico</p>
                    <p className="text-xs text-muted-foreground mt-1">Imagens (JPG, PNG) ou Laudos (PDF)</p>
                </div>
            </div>

            <div className="bg-muted/20 border border-border/40 rounded-3xl p-6 flex flex-col justify-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Imagens Clínicas</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Máximo 10MB • JPG, PNG, WEBP</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Exames Laboratoriais</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Máximo 20MB • PDF</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
