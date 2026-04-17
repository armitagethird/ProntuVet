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
    if (!user) return null

    // Buscas paralelas para não travar a renderização
    const [profileRes, usageRes] = await Promise.all([
        supabase.from('profiles').select('plano').eq('id', user.id).single(),
        supabase
            .from('uso_consultas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('sucesso', true)
            .gte('data_consulta', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ])

    const userFirstName = user.user_metadata?.first_name || 'Doutor(a)'
    const plano = profileRes.data?.plano || 'free'
    const monthlyUsage = usageRes.count || 0

    return (
        <DashboardClient 
            userFirstName={userFirstName} 
            templatesPromise={templatesPromise} 
            plano={plano}
            monthlyUsage={monthlyUsage}
        />
    )
}

