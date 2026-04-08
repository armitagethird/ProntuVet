import { createServerClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Encapsula a lógica de "buscar animal existente ou criar novo" para um usuário.
 * Centraliza esta lógica para evitar duplicação entre as rotas da API.
 *
 * @param supabase - Instância autenticada do cliente Supabase
 * @param userId - ID do usuário autenticado
 * @param name - Nome do animal
 * @param species - Espécie do animal (opcional)
 * @returns O ID do animal encontrado ou criado, ou null em caso de falha
 */
export async function findOrCreateAnimal(
    supabase: SupabaseClient,
    userId: string,
    name: string,
    species?: string | null
): Promise<string | null> {
    if (!name || name.trim().length === 0) return null

    // Busca por animal existente (case-insensitive)
    const { data: existingAnimals, error: fetchError } = await supabase
        .from('animals')
        .select('id, name')
        .eq('user_id', userId)
        .ilike('name', name.trim())
        .limit(1)

    if (fetchError) {
        console.error('[findOrCreateAnimal] Erro ao buscar animal:', fetchError)
        return null
    }

    if (existingAnimals && existingAnimals.length > 0) {
        return existingAnimals[0].id
    }

    // Cria novo animal
    const { data: newAnimal, error: createError } = await supabase
        .from('animals')
        .insert({
            user_id: userId,
            name: name.trim(),
            species: species ?? null,
        })
        .select('id')
        .single()

    if (createError || !newAnimal) {
        console.error('[findOrCreateAnimal] Erro ao criar animal:', createError)
        return null
    }

    return newAnimal.id
}
