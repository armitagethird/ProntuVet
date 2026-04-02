import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data: history, error } = await supabase
            .from('consultations')
            .select('id, title, created_at, mode, tutor_name')
            .eq('animal_id', params.id)
            .eq('user_id', user.id) // Security: only user's own data
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao buscar histórico do animal:", error)
            return NextResponse.json({ error: 'Erro ao carregar o histórico' }, { status: 500 })
        }

        return NextResponse.json({ success: true, history })

    } catch (error: any) {
        console.error("Animal History API error:", error)
        return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
    }
}
