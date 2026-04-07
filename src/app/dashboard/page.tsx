import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null;
    }

    // Fetch user templates
    const { data: templates } = await supabase
        .from('consultation_templates')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const userFirstName = user.user_metadata?.first_name || 'Doutor(a)'

    return (
        <DashboardClient 
            userFirstName={userFirstName} 
            templates={templates || []} 
        />
    )
}

