import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { User, Activity, Dog } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <header className="border-b bg-card text-card-foreground shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-10">
                <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    ClinicScribe AI
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
                <p>ClinicScribe AI - MVP © {new Date().getFullYear()}</p>
            </footer>
        </div>
    )
}
