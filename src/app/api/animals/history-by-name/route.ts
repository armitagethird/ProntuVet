import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name || name.trim().length < 2) {
        return NextResponse.json({ history: [] })
    }

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // 1. Find all animal IDs with this name (case-insensitive) for this user
        const { data: relatedAnimals } = await supabase
            .from('animals')
            .select('id')
            .ilike('name', name.trim())
            .eq('user_id', user.id)

        const animalIds = relatedAnimals?.map(a => a.id) || []
        const namePattern = `%${name.trim()}%`

        // 2. Fetch all consultations: Broad search across IDs, Title and Structured Content
        // We look for:
        // - Specific animal IDs
        // - Name mentioned in Title
        // - Name mentioned in 'Nome do Paciente' inside structured_content JSON
        let query = supabase
            .from('consultations')
            .select('id, title, created_at, mode, tutor_name, resumo_trilha, tags, animal_id, structured_content')
            .eq('user_id', user.id)

        const orConditions = []
        if (animalIds.length > 0) {
            orConditions.push(`animal_id.in.(${animalIds.join(',')})`)
        }
        
        // Add name pattern matching for titles and structured JSON
        orConditions.push(`title.ilike.${namePattern}`)
        
        // Final broad OR query
        query = query.or(orConditions.join(','))

        const { data: history, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error("Erro ao buscar histórico por nome:", error)
            return NextResponse.json({ error: 'Erro ao carregar o histórico' }, { status: 500 })
        }

        return NextResponse.json({ success: true, history })

    } catch (error: any) {
        console.error("History By Name API error:", error)
        return NextResponse.json({ error: 'Erro ao carregar o histórico' }, { status: 500 })
    }
}
