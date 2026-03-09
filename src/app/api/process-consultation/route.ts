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
Sua tarefa é receber a transcrição bruta de uma consulta veterinária e organizá-la formalmente em um texto clínico estruturado de acordo com o MODELO DE PRONTUÁRIO fornecido abaixo.

MODELO DE PRONTUÁRIO (Siga ESTA exata estrutura de chaves):
${templateContent}

Instruções adicionais:
1. Mantenha um tom estritamente profissional e técnico.
2. Identifique veterinário, tutor e animal quando possível. Diferencie o que foi relatado pelo tutor do que foi observado pelo veterinário.
3. Não invente informações. Se uma informação pedida no modelo de prontuário não foi dita, deixe o campo em branco ou preencha com "Não informado" ou "Não mencionado".
4. Formate a saída OBRIGATORIAMENTE com as chaves do modelo fornecido, como um objeto JSON estruturado onde as chaves principais são as seções listadas no modelo e os valores SÃO OBRIGATORIAMENTE STRINGS. Nunca crie sub-objetos ou arrays adicionais no JSON retornado. Se houver múltiplos dados para uma seção, agrupe-os em um único texto (string).`

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

        const structuredContent = JSON.parse(structuredContentString)

        // Generate a title safely
        let title = 'Consulta Veterinária'
        // Try to automatically guess a title based on typical template fields
        const possiblePatientKeys = ['Paciente', 'paciente', 'Nome do animal', 'Nome', 'Identificação', 'Animal']
        for (const key of possiblePatientKeys) {
            if (structuredContent[key] && typeof structuredContent[key] === 'string' && structuredContent[key] !== 'Não informado' && structuredContent[key] !== 'Não mencionado') {
                title = `Consulta: ${structuredContent[key].substring(0, 40)}`
                break
            }
        }

        // 4. Save to Database
        const { data: dbData, error: dbError } = await supabase
            .from('consultations')
            .insert({
                user_id: user.id,
                mode: 'vet', // hardcode to vet to satisfy check constraint
                title: title,
                transcription: transcribedText,
                structured_content: structuredContent
            })
            .select('id')
            .single()

        if (dbError) {
            console.error("Erro no resgistro do banco:", dbError)
            throw new Error("Falha ao salvar no banco de dados.")
        }

        // 5. Return Success
        return NextResponse.json({ success: true, consultationId: dbData.id })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
