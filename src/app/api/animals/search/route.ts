import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const name = searchParams.get('name')

        if (!name) {
            return NextResponse.json({ animals: [] })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Search for animals with similar name for this user
        // We also want to get the latest tutor name for auto-fill logic
        const { data: animals, error } = await supabase
            .from('animals')
            .select(`
                id, 
                name, 
                species, 
                breed,
                consultations (
                    tutor_name,
                    created_at
                )
            `)
            .eq('user_id', user.id)
            .ilike('name', `%${name}%`)
            .order('created_at', { referencedTable: 'consultations', ascending: false })
            .limit(5);

        if (error) {
            console.error("Search error:", error)
            return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
        }

        // Add last_tutor_name for each animal for convenience
        const processedAnimals = animals?.map(animal => {
            const lastConsultation = animal.consultations?.[0]; // consultations is ordered by created_at in DB view or we can order here
            return {
                ...animal,
                last_tutor_name: lastConsultation?.tutor_name || null
            }
        })

        return NextResponse.json({ animals: processedAnimals })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
