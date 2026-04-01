import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { User, Dog } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <header className="border-b bg-card text-card-foreground shadow-sm px-4 h-14 flex justify-between items-center sticky top-0 z-10 overflow-visible">
                <div className="font-bold text-lg tracking-tight flex items-center gap-3">
                    <div className="relative animate-float scale-[1.7] origin-center translate-y-2 translate-x-1">
                        <Image src="/logo.png" alt="ProntuVet Logo" width={40} height={40} className="object-contain drop-shadow-sm" priority />
                    </div>
                    <span className="ml-3">ProntuVet</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        {user?.email}
                    </span>
                    <form action={logout}>
                        <Button variant="outline" size="sm">Sair</Button>
                    </form>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
                {children}
            </main>

            <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-auto">
                <p>ProntuVet - MVP © {new Date().getFullYear()}</p>
            </footer>
        </div>
    )
}
