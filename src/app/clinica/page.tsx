import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClinicaClient from './ClinicaClient'

export default async function ClinicaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .maybeSingle()

    return (
        <main className="max-w-4xl mx-auto px-4 py-10">
            <ClinicaClient
                initialHasOrg={!!membership}
                initialRole={membership?.role ?? null}
                currentUserId={user.id}
            />
        </main>
    )
}
