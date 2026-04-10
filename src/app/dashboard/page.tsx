import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
    const supabase = await createClient()
    // Apenas esperamos a Autenticação. Desbloqueia FCP.
    const userRes = await supabase.auth.getUser()
    
    // Deixamos a query rodando como Promessa sem travar a tela (React RSC Streaming)
    const templatesPromise = supabase
        .from('consultation_templates')
        .select('id, name')
        .order('created_at', { ascending: false })
        .then(res => res.data || [])

    const user = userRes.data.user

    if (!user) {
        return null;
    }

    const userFirstName = user.user_metadata?.first_name || 'Doutor(a)'

    return (
        <DashboardClient 
            userFirstName={userFirstName} 
            templatesPromise={templatesPromise} 
        />
    )
}

