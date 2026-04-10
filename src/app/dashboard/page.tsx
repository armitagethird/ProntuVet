import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
    const supabase = await createClient()
    // Parallel fetch for user and templates to optimize TTFB
    const [userRes, templatesRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase
            .from('consultation_templates')
            .select('id, name')
            .order('created_at', { ascending: false })
    ])

    const user = userRes.data.user
    const templates = templatesRes.data

    if (!user) {
        return null;
    }

    const userFirstName = user.user_metadata?.first_name || 'Doutor(a)'

    return (
        <DashboardClient 
            userFirstName={userFirstName} 
            templates={templates || []} 
        />
    )
}

