'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export function UserNav() {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    if (pathname === '/login') return null;

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            toast.success('Você foi desconectado.')
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error('Error signing out:', error)
            toast.error('Ocorreu um erro ao sair.')
        }
    }

    return (
        <div className="absolute top-4 right-4 z-50">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 bg-background/50 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shadow-sm rounded-full transition-all"
            >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
            </Button>
        </div>
    )
}
