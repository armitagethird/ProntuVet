import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeHistoryQuery } from '@/lib/gemini'

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
            // We can't easily join filter in a single ilike on the related table in simple select
            // So we'll use the contains or we'll filter animals first if needed, 
            // but for simplicity in MVP we'll use a broad search on title or metadata if matched.
            dbQuery = dbQuery.or(`title.ilike.%${filters.animal}%,tutor_name.ilike.%${filters.animal}%`)
        }

        if (filters.startDate) {
            dbQuery = dbQuery.gte('created_at', filters.startDate)
        }
        if (filters.endDate) {
            dbQuery = dbQuery.lte('created_at', filters.endDate)
        }
        
        if (filters.keywords && filters.keywords !== '...') {
            // Search in structured_content (JSONB) or transcription
            // For now, let's search in transcription for medical terms
            dbQuery = dbQuery.ilike('transcription', `%${filters.keywords}%`)
        }

        const { data, error } = await dbQuery
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error

        // 3. Optional: Filter by animal name in memory if the relation join didn't work for filtering
        let results = data;
        if (filters.animal && filters.animal !== '...') {
            results = data.filter(c => 
                c.animals?.name?.toLowerCase().includes(filters.animal.toLowerCase()) ||
                c.title?.toLowerCase().includes(filters.animal.toLowerCase())
            )
        }

        return NextResponse.json({ 
            results,
            filters_used: filters 
        })

    } catch (error: any) {
        console.error('Search API Error:', error)
        return NextResponse.json({ error: 'Erro ao processar busca inteligente' }, { status: 500 })
    }
}
