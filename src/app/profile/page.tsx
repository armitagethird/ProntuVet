import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import ClientProfile from './ClientProfile'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Pass the server-side logout action to the client
    return <ClientProfile initialUser={user} onLogout={logout} />
}
