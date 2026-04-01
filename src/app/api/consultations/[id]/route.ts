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
        const { structured_content, tutor_summary, vet_summary, manual_notes, animal_name, animal_species, tutor_name } = body

        if (!structured_content && tutor_summary === undefined && vet_summary === undefined && manual_notes === undefined && animal_name === undefined && animal_species === undefined && tutor_name === undefined) {
            return NextResponse.json({ error: 'Nenhum dado para atualizar enviado' }, { status: 400 })
        }

        const updateData: any = {}
        if (structured_content !== undefined) updateData.structured_content = structured_content;
        if (tutor_summary !== undefined) updateData.tutor_summary = tutor_summary;
        if (vet_summary !== undefined) updateData.vet_summary = vet_summary;
        if (manual_notes !== undefined) updateData.manual_notes = manual_notes;
        if (tutor_name !== undefined) updateData.tutor_name = tutor_name;

        // Handle case where user edits the animal name/species
        if (animal_name !== undefined || animal_species !== undefined) {

            // If they cleared the name entirely, unlink the animal
            if (animal_name === '') {
                updateData.animal_id = null;
            } else if (animal_name) {
                // Try to find the animal first
                const { data: existingAnimals } = await supabase
                    .from('animals')
                    .select('id, name')
                    .eq('user_id', user.id)
                    .ilike('name', animal_name)
                    .limit(1);

                if (existingAnimals && existingAnimals.length > 0) {
                    updateData.animal_id = existingAnimals[0].id;

                    // Update species if changed
                    if (animal_species !== undefined && animal_species !== '') {
                        await supabase
                            .from('animals')
                            .update({ species: animal_species })
                            .eq('id', existingAnimals[0].id);
                    }
                } else {
                    // Create new animal
                    const { data: newAnimal } = await supabase
                        .from('animals')
                        .insert({
                            user_id: user.id,
                            name: animal_name,
                            species: animal_species || null,
                        })
                        .select('id')
                        .single()

                    if (newAnimal) {
                        updateData.animal_id = newAnimal.id;
                    }
                }
            }
        }

        const { data, error } = await supabase
            .from('consultations')
            .update(updateData)
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
