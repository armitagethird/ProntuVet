import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    const schema = z.object({
        id: z.string().uuid('ID inválido'),
    })

    const validation = schema.safeParse(params)
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // 1. Get the animal name for the given ID
        const { data: targetAnimal } = await supabase
            .from('animals')
            .select('name')
            .eq('id', params.id)
            .single()

        const name = targetAnimal?.name || '';
        const namePattern = `%${name.trim()}%`

        // 2. Find all consultations for ANIMALS with that same name (case-insensitive)
        const { data: relatedAnimals } = await supabase
            .from('animals')
            .select('id')
            .ilike('name', name.trim())
            .eq('user_id', user.id)

        const animalIds = relatedAnimals?.map(a => a.id) || [params.id]

        // 3. Universal Broad Query: Match by IDs OR title pattern
        let query = supabase
            .from('consultations')
            .select('id, title, created_at, mode, tutor_name, resumo_trilha, tags, animal_id, structured_content')
            .eq('user_id', user.id)

        const orConditions = [`animal_id.in.(${animalIds.join(',')})`]
        
        if (name && name.length >= 2) {
             orConditions.push(`title.ilike.${namePattern}`)
        }
        
        const { data: history, error } = await query.or(orConditions.join(',')).order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao buscar histórico unificado:", error)
            return NextResponse.json({ error: 'Erro ao carregar o histórico' }, { status: 500 })
        }

        return NextResponse.json({ success: true, history })

    } catch (error: any) {
        console.error("Animal History API error:", error)
        return NextResponse.json({ error: 'Erro ao carregar o histórico' }, { status: 500 })
    }
}
