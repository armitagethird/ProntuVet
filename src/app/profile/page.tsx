import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import ClientProfile from './ClientProfile'

import { Suspense } from 'react'

export default async function ProfilePage() {
    return (
        <div className="flex-1 w-full max-w-4xl mx-auto pt-8 px-4 pb-20 fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-8">Meu Perfil</h1>
            <Suspense fallback={
                <div className="w-full flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                </div>
            }>
                <ProfileFetcher />
            </Suspense>
        </div>
    )
}

async function ProfileFetcher() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('plano').eq('id', user.id).single()
    const plano = profile?.plano || 'free'

    return <ClientProfile initialUser={user} plano={plano} onLogout={logout} />
}
