'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function AcceptButton({ token }: { token: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const onAccept = async () => {
        setLoading(true)
        const id = toast.loading('Aceitando convite...')
        try {
            const res = await fetch('/api/clinica/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro')
            toast.success('Você entrou na clínica!', { id })
            router.push('/clinica')
        } catch (err: any) {
            toast.error(err.message || 'Erro ao aceitar convite.', { id })
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={onAccept}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white w-full h-12"
        >
            {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
            ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Aceitar e entrar</>
            )}
        </Button>
    )
}
