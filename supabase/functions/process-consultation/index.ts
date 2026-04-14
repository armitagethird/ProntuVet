import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.3.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: corsHeaders })

    // 2. Verificar Status do Perfil
    const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).single()
    if (profile?.status === 'bloqueado' || profile?.status === 'cancelado') {
      return new Response(JSON.stringify({ error: 'Assinatura inativa' }), { status: 403, headers: corsHeaders })
    }

    // 3. Verificar Limites (Mensal 200)
    const inicioMes = new Date()
    inicioMes.setUTCDate(1)
    inicioMes.setUTCHours(0,0,0,0)
    const { count: monthCount } = await supabase.from('uso_consultas').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('sucesso', true).gte('data_consulta', inicioMes.toISOString())
    if ((monthCount ?? 0) >= 200) return new Response(JSON.stringify({ error: 'Limite mensal de 200 consultas atingido.' }), { status: 429, headers: corsHeaders })

    // 4. Rate Limit (30/h)
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000)
    const { count: hourCount } = await supabase.from('uso_consultas').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('data_consulta', umaHoraAtras.toISOString())
    if ((hourCount ?? 0) >= 30) return new Response(JSON.stringify({ error: 'Muitas requisições. Aguarde uma hora.' }), { status: 429, headers: corsHeaders })

    // --- RECEBER DADOS ---
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const templateId = formData.get('templateId') as string
    const duracaoAudio = parseInt(formData.get('duracaoSeconds') as string || '0')

    if (!audioFile || !templateId) throw new Error("Dados incompletos.")

    // --- BUSCAR TEMPLATE (SEGURANÇA: Server-side check) ---
    let templateContent = ""
    if (templateId === 'system-default') {
        templateContent = "Motivo da Consulta, Anamnese, Exame Físico, Suspeita Diagnóstica, Exames Solicitados, Tratamento, Orientações ao Tutor"
    } else {
        const { data: template } = await supabase.from('consultation_templates').select('content').eq('id', templateId).single()
        if (!template) throw new Error("Modelo não encontrado.")
        templateContent = template.content
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        systemInstruction: "Você é um assistente veterinário de elite. O áudio contém uma consulta. Extraia os dados em JSON estruturado seguindo o modelo fornecido. Mantenha fidelidade total ao que foi dito. Se houver silêncio, retorne erro."
    })

    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    try {
      const result = await model.generateContent([
        { inlineData: { data: audioBase64, mimeType: audioFile.type || 'audio/webm' } },
        { text: `Gere o prontuário em JSON baseado neste modelo de chaves:\n${templateContent}\n\nRetorne o JSON completo com animal_name, animal_species, tutor_name, tutor_summary, vet_summary, resumo_trilha, transcription, tags e o objeto 'prontuario'.` }
      ])
      
      const response = await result.response
      const resultText = response.text()
      const tokensInput = response.usageMetadata?.promptTokenCount ?? 0
      const tokensOutput = response.usageMetadata?.candidatesTokenCount ?? 0

      // Log de Sucesso
      await supabase.from('uso_consultas').insert({
        user_id: user.id,
        duracao_audio_segundos: duracaoAudio,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        custo_estimado_usd: (tokensInput * 0.0000001) + (tokensOutput * 0.0000004),
        ip_origem: req.headers.get('x-forwarded-for') ?? 'desconhecido',
        sucesso: true
      })

      // Parse JSON
      const geminiData = JSON.parse(resultText.replace(/```json|```/g, ''))
      
      if (geminiData.error) throw new Error(geminiData.error)

      // Gerenciar Animal
      let animalId = null
      if (geminiData.animal_name) {
        const { data: existing } = await supabase.from('animals').select('id').eq('user_id', user.id).ilike('name', geminiData.animal_name).maybeSingle()
        if (existing) {
          animalId = existing.id
        } else {
          const { data: created } = await supabase.from('animals').insert({ user_id: user.id, name: geminiData.animal_name, species: geminiData.animal_species }).select('id').single()
          animalId = created?.id
        }
      }

      // Salvar Consulta
      const { data: consultation, error: consError } = await supabase.from('consultations').insert({
        user_id: user.id,
        title: geminiData.animal_name ? `Consulta: ${geminiData.animal_name}` : 'Consulta Veterinária',
        transcription: geminiData.transcription,
        structured_content: geminiData.prontuario,
        animal_id: animalId,
        tutor_name: geminiData.tutor_name,
        tutor_summary: geminiData.tutor_summary,
        vet_summary: geminiData.vet_summary,
        resumo_trilha: geminiData.resumo_trilha,
        tags: geminiData.tags,
        mode: 'vet'
      }).select('id').single()

      if (consError) throw consError

      return new Response(JSON.stringify({ success: true, consultationId: consultation.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (err) {
      await supabase.from('uso_consultas').insert({ user_id: user.id, sucesso: false, erro: err.message, ip_origem: req.headers.get('x-forwarded-for') ?? 'desconhecido' })
      throw err
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
