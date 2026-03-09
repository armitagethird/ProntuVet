import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
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

        const body = await request.json()
        const { structured_content } = body

        if (!structured_content) {
            return NextResponse.json({ error: 'Conteúdo estruturado não enviado' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('consultations')
            .update({ structured_content })
            .eq('id', params.id)
            .eq('user_id', user.id) // Ensure they only own this row
            .select('*')
            .single()

        if (error) {
            console.error("Erro ao atualizar banco de dados:", error)
            return NextResponse.json({ error: 'Erro ao atualizar o banco de dados' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error("API error:", error)
        return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
    }
}
