import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI, { toFile } from 'openai'

// This allows the route to run for up to 5 minutes to handle large audio files
export const maxDuration = 300

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('audio') as File | null
        const templateId = formData.get('templateId') as string | null

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'Áudio não fornecido ou inválido' }, { status: 400 })
        }

        if (!templateId) {
            return NextResponse.json({ error: 'ID do modelo não fornecido' }, { status: 400 })
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

        const systemPrompt = `Você é um assistente veterinário de alto nível.
Sua tarefa é receber a transcrição bruta de uma consulta veterinária e organizá-la formalmente.
Obrigatório:
1. Prontuário Principal: Mantenha um tom estritamente profissional, científico e técnico. O vocabulário DEVE ser técnico veterinário, utilizando sempre os termos científicos adequados e jargões da medicina veterinária, garantindo que o texto pareça ter sido escrito por um médico veterinário experiente. Não use linguagem leiga aqui em hipótese alguma. Estruture de acordo com o MODELO DE PRONTUÁRIO fornecido.
2. Identifique os seguintes dados extraídos da consulta (se não informados, deixe nulo ou vazio):
   - "animal_name": Nome do animal (string)
   - "animal_species": Espécie do animal (ex: cão, gato) (string)
   - "tutor_name": Nome do tutor (string)
   - "tutor_summary": Um resumo simples, claro e amigável da consulta, voltado para o tutor (string).
   - "vet_summary": Um resumo técnico, objetivo e direto da consulta, voltado para passagem de caso para outro veterinário (string).
   - "tags": Lista de tags/categorias da consulta (ex: ["dermatologia", "retorno", "vacinação", "canino"]) (array de strings, máximo 5).

MODELO DE PRONTUÁRIO Mestre (Siga ESTA exata estrutura de chaves OBRIGATORIAMENTE para o objeto "prontuario"):
${templateContent}

Instruções finais do formato de saída:
Formate a saída OBRIGATORIAMENTE como um único objeto JSON estruturado da seguinte forma:
{
  "animal_name": "...",
  "animal_species": "...",
  "tutor_name": "...",
  "tutor_summary": "...",
  "vet_summary": "...",
  "tags": ["...", "..."],
  "prontuario": {
    "Chave 1 do Modelo": "...",
    "Chave 2 do Modelo": "..."
  }
}
Não fuja dessa estrutura raiz. Os valores dentro de "prontuario" DEVEM ser strings simples e usar as chaves exatas do MODELO DE PRONTUÁRIO.`

        // 1. Convert Blob to File object for OpenAI
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const openaiFile = await toFile(buffer, 'audio.webm', { type: 'audio/webm' })

        // 2. Transcribe Audio using Whisper
        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: openaiFile,
            model: 'whisper-1',
            language: 'pt', // Force portuguese language for better results
        })

        const transcribedText = transcriptionResponse.text

        if (!transcribedText || transcribedText.trim().length === 0) {
            return NextResponse.json({ error: 'Não foi possível transcrever voz no áudio' }, { status: 400 })
        }

        // 3. Structure Transcription using GPT-4o-mini
        const completionResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcribedText }
            ],
            response_format: { type: 'json_object' }
        })

        const structuredContentString = completionResponse.choices[0].message.content
        if (!structuredContentString) {
            throw new Error("Falha ao gerar estrutura JSON a partir da GPT.")
        }

        const openaiResult = JSON.parse(structuredContentString)

        // Extract root info
        const animalNameRaw = openaiResult.animal_name;
        const animalName = (animalNameRaw && animalNameRaw !== 'Não informado' && animalNameRaw !== 'Não mencionado') ? String(animalNameRaw).trim() : null;

        const animalSpecies = openaiResult.animal_species || null;
        const tutorName = openaiResult.tutor_name || null;
        const tutorSummary = openaiResult.tutor_summary || null;
        const vetSummary = openaiResult.vet_summary || null;
        const tags = Array.isArray(openaiResult.tags) ? openaiResult.tags : [];
        const prontuario = openaiResult.prontuario || openaiResult; // Fallback in case AI ignores wrapper

        // Generate a title safely
        let title = 'Consulta Veterinária'
        if (animalName) {
            title = `Consulta: ${animalName.substring(0, 40)}`
        }

        // 4. Handle Animals table (Find or Create)
        let animalId = null;
        if (animalName) {
            // Check if animal exists for this user (case insensitive-ish)
            const { data: existingAnimals, error: fetchError } = await supabase
                .from('animals')
                .select('id, name')
                .eq('user_id', user.id)
                .ilike('name', animalName)
                .limit(1);

            if (existingAnimals && existingAnimals.length > 0) {
                animalId = existingAnimals[0].id;
            } else {
                // Create new animal
                const { data: newAnimal, error: createError } = await supabase
                    .from('animals')
                    .insert({
                        user_id: user.id,
                        name: animalName,
                        species: animalSpecies,
                    })
                    .select('id')
                    .single()

                if (!createError && newAnimal) {
                    animalId = newAnimal.id;
                } else {
                    console.error("Erro ao criar animal:", createError);
                    // Silently continue, animalId remains null
                }
            }
        }

        // 5. Save to Database
        const { data: dbData, error: dbError } = await supabase
            .from('consultations')
            .insert({
                user_id: user.id,
                mode: 'vet',
                title: title,
                transcription: transcribedText,
                structured_content: prontuario,
                animal_id: animalId,
                tutor_name: tutorName,
                tutor_summary: tutorSummary,
                vet_summary: vetSummary,
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

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
