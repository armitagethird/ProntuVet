import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findOrCreateAnimal } from '@/lib/supabase/animals'
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
    } catch (error: unknown) {
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

        const updateData: Partial<{
            structured_content: Record<string, string>
            tutor_summary: string
            vet_summary: string
            manual_notes: string
            tutor_name: string
            title: string
            animal_id: string | null
        }> = {}
        if (structured_content !== undefined) updateData.structured_content = structured_content;
        if (tutor_summary !== undefined) updateData.tutor_summary = tutor_summary;
        if (vet_summary !== undefined) updateData.vet_summary = vet_summary;
        if (manual_notes !== undefined) updateData.manual_notes = manual_notes;
        if (tutor_name !== undefined) updateData.tutor_name = tutor_name;
        if (body.title !== undefined) updateData.title = body.title;

        // Handle case where user edits the animal name/species
        if (animal_name !== undefined || animal_species !== undefined) {

            // Se o nome foi apagado, desvincula o animal
            if (animal_name === '') {
                updateData.animal_id = null;
            } else if (animal_name) {

                // Se já existe um animal vinculado, atualiza ESSE registro (evita duplicações)
                if (currentConsultation?.animal_id) {
                    const updateAnimalObj: { name: string; species?: string } = { name: animal_name };
                    if (animal_species !== undefined) updateAnimalObj.species = animal_species;

                    // FIX #4: Garante ownership com .eq('user_id', user.id)
                    await supabase
                        .from('animals')
                        .update(updateAnimalObj)
                        .eq('id', currentConsultation.animal_id)
                        .eq('user_id', user.id);

                    updateData.animal_id = currentConsultation.animal_id;
                } else {
                    // Sem animal vinculado: busca ou cria via utiliário compartilhado
                    const animalId = await findOrCreateAnimal(supabase, user.id, animal_name, animal_species)
                    if (animalId) {
                        updateData.animal_id = animalId

                        // Atualiza espécie se informada e diferente
                        if (animal_species) {
                            await supabase
                                .from('animals')
                                .update({ species: animal_species })
                                .eq('id', animalId)
                                .eq('user_id', user.id);
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

    } catch (error: unknown) {
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

    } catch (error: unknown) {
        console.error("Delete API error:", error)
        return NextResponse.json({ error: 'Erro ao excluir o prontuário' }, { status: 500 })
    }
}
