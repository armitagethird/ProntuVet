import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const consultationIdSchema = z.object({
    id: z.string().uuid('ID de consulta inválido'),
})

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const validation = consultationIdSchema.safeParse(params)
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('consultations')
            .select('*, animals(name, species)')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        return NextResponse.json({ error: 'Erro ao carregar os dados da consulta' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const paramValidation = consultationIdSchema.safeParse(params)
    if (!paramValidation.success) {
        return NextResponse.json({ error: paramValidation.error.issues[0].message }, { status: 400 })
    }

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        
        const patchSchema = z.object({
            structured_content: z.any().optional(),
            tutor_summary: z.string().optional(),
            vet_summary: z.string().optional(),
            manual_notes: z.string().optional(),
            animal_name: z.string().max(100).optional(),
            animal_species: z.string().max(50).optional(),
            tutor_name: z.string().max(100).optional(),
            title: z.string().max(200).optional(),
        }).refine(data => Object.keys(data).length > 0, {
            message: "Nenhum dado para atualizar enviado"
        })

        const bodyValidation = patchSchema.safeParse(body)
        if (!bodyValidation.success) {
            return NextResponse.json({ error: bodyValidation.error.issues[0].message }, { status: 400 })
        }

        const { structured_content, tutor_summary, vet_summary, manual_notes, animal_name, animal_species, tutor_name } = bodyValidation.data

        // 1. Fetch current consultation to get animal_id
        const { data: currentConsultation } = await supabase
            .from('consultations')
            .select('animal_id')
            .eq('id', params.id)
            .single();

        const updateData: any = {}
        if (structured_content !== undefined) updateData.structured_content = structured_content;
        if (tutor_summary !== undefined) updateData.tutor_summary = tutor_summary;
        if (vet_summary !== undefined) updateData.vet_summary = vet_summary;
        if (manual_notes !== undefined) updateData.manual_notes = manual_notes;
        if (tutor_name !== undefined) updateData.tutor_name = tutor_name;
        if (body.title !== undefined) updateData.title = body.title;

        // Handle case where user edits the animal name/species
        if (animal_name !== undefined || animal_species !== undefined) {

            // If they cleared the name entirely, unlink the animal
            if (animal_name === '') {
                updateData.animal_id = null;
            } else if (animal_name) {
                
                // FIXED LOGIC: If there's already an animal_id, update THAT record to avoid duplicates
                if (currentConsultation?.animal_id) {
                    const updateAnimalObj: any = { name: animal_name };
                    if (animal_species !== undefined) updateAnimalObj.species = animal_species;
                    
                    await supabase
                        .from('animals')
                        .update(updateAnimalObj)
                        .eq('id', currentConsultation.animal_id);
                    
                    updateData.animal_id = currentConsultation.animal_id;
                } else {
                    // Try to find an animal with this name first for the user
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
        return NextResponse.json({ error: 'Erro ao atualizar a consulta' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const validation = consultationIdSchema.safeParse(params)
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }
    
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // 1. Fetch all attachments for this consultation before deleting
        const { data: attachments } = await supabase
            .from('anexos_consulta')
            .select('storage_path')
            .eq('consulta_id', params.id);

        if (attachments && attachments.length > 0) {
            const paths = attachments.map(a => a.storage_path);
            
            // 2. Delete from Storage
            const { error: storageError } = await supabase
                .storage
                .from('medical-attachments')
                .remove(paths);
            
            if (storageError) {
                console.error("Erro ao deletar arquivos do storage:", storageError);
            }
        }

        // 3. Delete the Consultation (Cascade will handle anexos_consulta DB records)
        const { error } = await supabase
            .from('consultations')
            .delete()
            .eq('id', params.id)
            .eq('user_id', user.id)

        if (error) {
            console.error("Erro ao deletar consulta:", error)
            return NextResponse.json({ error: 'Erro ao excluir o prontuário' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Delete API error:", error)
        return NextResponse.json({ error: 'Erro ao excluir o prontuário' }, { status: 500 })
    }
}
