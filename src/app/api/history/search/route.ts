import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeHistoryQuery } from '@/lib/gemini'

/** Escapa caracteres especiais do operador LIKE para evitar comportamento inesperado */
function sanitizeLike(value: string): string {
    return value.replace(/[%_\\]/g, '\\$&')
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q')

        if (!query) {
            return NextResponse.json({ results: [] })
        }

        // 1. Analyze query with Gemini
        const analysisString = await analyzeHistoryQuery(query)
        let filters;
        try {
            filters = JSON.parse(analysisString)
        } catch (e) {
            console.error("Erro ao parsear busca Gemini:", analysisString)
            filters = { animal: query, tutor: null, startDate: null, endDate: null, keywords: query }
        }

        // 2. Build Supabase Query
        let dbQuery = supabase
            .from('consultations')
            .select(`
                id, 
                title, 
                mode, 
                created_at,
                tags,
                tutor_name,
                structured_content,
                animal_id,
                animals ( id, name, species )
            `)
            .eq('user_id', user.id)

        // Apply filters
        if (filters.animal && filters.animal !== '...') {
            const safeAnimal = sanitizeLike(filters.animal)
            dbQuery = dbQuery.or(`title.ilike.%${safeAnimal}%,tutor_name.ilike.%${safeAnimal}%`)
        }

        if (filters.startDate) {
            dbQuery = dbQuery.gte('created_at', filters.startDate)
        }
        if (filters.endDate) {
            dbQuery = dbQuery.lte('created_at', filters.endDate)
        }
        
        if (filters.keywords && filters.keywords !== '...') {
            const safeKeywords = sanitizeLike(filters.keywords)
            dbQuery = dbQuery.ilike('transcription', `%${safeKeywords}%`)
        }

        const { data, error } = await dbQuery
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error

        // 3. Filtra por nome do animal em memória (fallback ao join relacional)
        let results = data;
        if (filters.animal && filters.animal !== '...') {
            const animalFilter = filters.animal.toLowerCase()
            results = data.filter(c => {
                // Supabase pode retornar como array ou objeto dependendo da relação
                const animalName = Array.isArray(c.animals)
                    ? (c.animals as Array<{ name: string }>)[0]?.name
                    : (c.animals as { name: string } | null)?.name
                return (
                    animalName?.toLowerCase().includes(animalFilter) ||
                    c.title?.toLowerCase().includes(animalFilter)
                )
            })
        }

        return NextResponse.json({ 
            results,
            filters_used: filters 
        })

    } catch (error: unknown) {
        console.error('Search API Error:', error)
        return NextResponse.json({ error: 'Erro ao processar busca inteligente' }, { status: 500 })
    }
}
