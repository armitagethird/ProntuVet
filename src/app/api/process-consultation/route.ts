import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProntuario } from '@/lib/gemini'
import { findOrCreateAnimal } from '@/lib/supabase/animals'
import { z } from 'zod'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ACCEPTED_AUDIO_TYPES = ['audio/', 'video/webm'] // Some browsers send webm as video/webm

// This allows the route to run for up to 5 minutes to handle large audio files
export const maxDuration = 300

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // --- RATE LIMIT CHECK (20 PER DAY) ---
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        const { count, error: countError } = await supabase
            .from('consultations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString())

        if (countError) {
            console.error("Erro ao verificar limite diário:", countError)
        } else if (count !== null && count >= 20) {
            return NextResponse.json({ 
                error: 'Você atingiu seu limite diário de 20 consultas. O limite será renovado amanhã.' 
            }, { status: 429 })
        }

        // --- RATE LIMIT CHECK (200 PER MONTH) ---
        const firstDayOfMonth = new Date()
        firstDayOfMonth.setUTCHours(0, 0, 0, 0)
        firstDayOfMonth.setUTCDate(1)

        const { count: monthCount, error: monthCountError } = await supabase
            .from('consultations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', firstDayOfMonth.toISOString())

        if (monthCountError) {
            console.error("Erro ao verificar limite mensal:", monthCountError)
        } else if (monthCount !== null && monthCount >= 200) {
            return NextResponse.json({ 
                error: 'Você atingiu o limite mensal de 200 consultas do seu plano. Entre em contato para upgrade.' 
            }, { status: 429 })
        }
        // -----------------------------------------
        // -------------------------------------

        const formData = await req.formData()
        const file = formData.get('audio') as File | null
        const templateId = formData.get('templateId') as string | null

        // 1. Basic Validation with Zod
        const schema = z.object({
            templateId: z.string().min(1, 'ID do modelo é obrigatório'),
        })

        const validation = schema.safeParse({ templateId })
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
        }

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'Áudio não fornecido ou inválido' }, { status: 400 })
        }

        // 2. File Security Checks
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'Arquivo muito grande. O limite é 25MB.' }, { status: 400 })
        }

        const isAudio = ACCEPTED_AUDIO_TYPES.some(type => file.type.startsWith(type))
        if (!isAudio && file.type !== '') {
            return NextResponse.json({ error: 'Formato de arquivo inválido. Envie apenas áudio.' }, { status: 400 })
        }

        let templateContent = '';

        if (templateId === 'system-default') {
            templateContent = `
- Motivo da Consulta (Queixa principal)
- Anamnese / Histórico
- Exame Físico (Sinais vitais, Achados)
- Suspeita Diagnóstica
- Exames Solicitados
- Tratamento / Prescrição
- Orientações ao Tutor`;
        } else {
            // Fetch the template to use its structure
            const { data: template, error: templateError } = await supabase
                .from('consultation_templates')
                .select('content')
                .eq('id', templateId)
                .single()

            if (templateError || !template) {
                return NextResponse.json({ error: 'Modelo de prontuário não encontrado' }, { status: 404 })
            }
            templateContent = template.content;
        }

        // 1. Convert Blob to Base64 for Gemini
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const audioBase64 = buffer.toString('base64')
        const mimeType = file.type || 'audio/webm'

        // 2. Process Multimodal Extraction (Single Call)
        // Isso é mais barato, rápido e evita alucinações ao dar contexto real do áudio à IA.
        const structuredContentString = await generateProntuario(audioBase64, mimeType, templateContent)
        
        let geminiResult;
        try {
            geminiResult = JSON.parse(structuredContentString)
            
            // Check for explicit safety-valve error from Gemini
            if (geminiResult.error) {
                return NextResponse.json({ error: geminiResult.error }, { status: 400 })
            }
        } catch (e) {
            console.error("Erro ao parsear JSON do Gemini:", structuredContentString)
            throw new Error("Falha ao gerar estrutura JSON a partir do Gemini.")
        }

        // --- EXTRACT DATA ---
        const animalNameRaw = geminiResult.animal_name;
        const animalName = (animalNameRaw && !['Não informado', 'Não mencionado', 'Nulo', 'N/A', 'N/m', 'Desconhecido', 'Não identificado'].includes(String(animalNameRaw).trim())) ? String(animalNameRaw).trim() : null;
        const animalSpecies = geminiResult.animal_species || null;
        const tutorNameRaw = geminiResult.tutor_name;
        const tutorName = (tutorNameRaw && !['Não informado', 'Não mencionado', 'Nulo', 'N/A'].includes(String(tutorNameRaw).trim())) ? String(tutorNameRaw).trim() : null;

        const tutorSummary = geminiResult.tutor_summary || null;
        const vetSummary = geminiResult.vet_summary || null;
        const resumoTrilha = geminiResult.resumo_trilha || null;
        const transcription = geminiResult.transcription || '';
        const tags = Array.isArray(geminiResult.tags) ? geminiResult.tags : [];
        const prontuario = geminiResult.prontuario || {};

        // --- VALIDATION: IS CONTENT MEANINGFUL? ---
        const emptyPatterns = [/não informado/i, /não mencionado/i, /nulo/i, /n\/a/i, /não consta/i, /silêncio/i, /ruído/i, /desconhecido/i, /sem conteúdo/i];
        const isBlacklisted = (text: string | null) => {
            if (!text) return true;
            const cleanText = text.trim().toLowerCase();
            return cleanText.length < 10 || emptyPatterns.some(pattern => pattern.test(cleanText));
        };

        let totalMeaningfulChars = 0;
        if (typeof prontuario === 'object' && prontuario !== null) {
            Object.values(prontuario).forEach(v => {
                if (typeof v === 'string' && !isBlacklisted(v)) {
                    totalMeaningfulChars += v.trim().length;
                }
            });
        }

        // Must have at least 30 chars of meaningful clinical data OR an identified animal
        if (!animalName && totalMeaningfulChars < 30) {
            return NextResponse.json({ 
                error: 'A consulta não pôde ser concluída. O áudio parece não conter informações clínicas suficientes ou está em silêncio.' 
            }, { status: 400 })
        }
        // ------------------------------------------
        // ------------------------------------------

        // Generate a title safely
        let title = 'Consulta Veterinária'
        if (animalName) {
            title = `Consulta: ${animalName.substring(0, 40)}`
        }

        // 4. Handle Animals table (Find or Create) — via shared utility
        let animalId: string | null = null;
        if (animalName) {
            animalId = await findOrCreateAnimal(supabase, user.id, animalName, animalSpecies)
        }

        // 5. Save to Database
        const { data: dbData, error: dbError } = await supabase
            .from('consultations')
            .insert({
                user_id: user.id,
                mode: 'vet',
                title: title,
                transcription: transcription,
                structured_content: prontuario,
                animal_id: animalId,
                tutor_name: tutorName,
                tutor_summary: tutorSummary,
                vet_summary: vetSummary,
                resumo_trilha: resumoTrilha,
                tags: tags
            })
            .select('id')
            .single()

        if (dbError) {
            console.error("Erro no registro do banco:", dbError)
            throw new Error("Falha ao salvar no banco de dados.")
        }

        // 6. Return Success
        return NextResponse.json({ success: true, consultationId: dbData.id })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao processar sua consulta'
        console.error('API Error:', error)
        return NextResponse.json(
            { 
                error: 'Ocorreu um erro ao processar sua consulta.',
                message: message // Enviamos a mensagem real para facilitar o debug pelo usuário
            },
            { status: 500 }
        )
    }
}


