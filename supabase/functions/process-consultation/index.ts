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

    // 1. Autenticação do Usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: corsHeaders })

    // 2. Buscar Perfil (Status e Plano)
    const { data: profile } = await supabase.from('profiles').select('status, plano').eq('id', user.id).single()
    
    if (!profile || profile.status === 'bloqueado' || profile.status === 'cancelado') {
      return new Response(JSON.stringify({ error: 'Sua assinatura está inativa ou bloqueada.' }), { status: 403, headers: corsHeaders })
    }

    const plano = profile.plano || 'free'

    // 3. Configuração de Limites por Plano
    const limits = {
      free: { monthly: 10, daily: 10, hourly: 5 },
      platinum: { monthly: 200, daily: 20, hourly: 25 }
    }[plano] || { monthly: 10, daily: 10, hourly: 5 }

    // 4. Verificação de Limites (Mês, Dia, Hora)
    const now = new Date()
    
    // Mês atual
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count: monthCount } = await supabase.from('uso_consultas').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('sucesso', true).gte('data_consulta', inicioMes)
    
    if ((monthCount || 0) >= limits.monthly) {
      return new Response(JSON.stringify({ 
        error: `Limite mensal de ${limits.monthly} consultas atingido para o plano ${plano}.`,
        message: 'Fale com o suporte para upgrade.' 
      }), { status: 429, headers: corsHeaders })
    }

    // Dia atual (Platinum apenas tem trava diária de 20)
    const inicioDia = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const { count: dayCount } = await supabase.from('uso_consultas').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('sucesso', true).gte('data_consulta', inicioDia)

    if ((dayCount || 0) >= limits.daily) {
      return new Response(JSON.stringify({ 
        error: `Limite diário de ${limits.daily} consultas atingido.`,
        message: 'Aguarde até amanhã para novas consultas.' 
      }), { status: 429, headers: corsHeaders })
    }

    // Hora atual (Rate Limit de Segurança)
    const umaHoraAtras = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const { count: hourCount } = await supabase.from('uso_consultas').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('data_consulta', umaHoraAtras)

    if ((hourCount || 0) >= limits.hourly) {
      return new Response(JSON.stringify({ 
        error: 'Muitas consultas em pouco tempo.', 
        message: 'Aguarde alguns minutos.' 
      }), { status: 429, headers: corsHeaders })
    }

    // --- PROCESSAR DADOS ---
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const templateId = formData.get('templateId') as string
    const duracaoAudio = parseInt(formData.get('duracaoSeconds') as string || '0')

    if (!audioFile || !templateId) throw new Error("Dados de consulta incompletos.")

    // Buscar Template
    let templateContent = ""
    if (templateId === 'system-default') {
        templateContent = "Motivo da Consulta, Anamnese, Exame Físico, Suspeita Diagnóstica, Exames Solicitados, Tratamento, Orientações ao Tutor"
    } else {
        const { data: template } = await supabase.from('consultation_templates').select('content').eq('id', templateId).single()
        if (!template) throw new Error("Modelo de prontuário não encontrado.")
        templateContent = template.content
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        systemInstruction: "Você é um assistente veterinário de elite. O áudio contém uma consulta. Extraia os dados em JSON estruturado seguindo o modelo fornecido. Mantenha fidelidade ao que foi dito."
    })

    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    try {
      const result = await model.generateContent([
        { inlineData: { data: audioBase64, mimeType: audioFile.type || 'audio/webm' } },
        { text: `Gere o prontuário em JSON baseado neste modelo:\n${templateContent}\n\nRetorne o JSON completo com animal_name, animal_species, tutor_name, tutor_summary, vet_summary, resumo_trilha, transcription, tags e o objeto 'prontuario'.` }
      ])
      
      const response = await result.response
      const resultText = response.text()
      const tokensInput = response.usageMetadata?.promptTokenCount ?? 0
      const tokensOutput = response.usageMetadata?.candidatesTokenCount ?? 0

      // Registrar Uso
      await supabase.from('uso_consultas').insert({
        user_id: user.id,
        duracao_audio_segundos: duracaoAudio,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        custo_estimado_usd: (tokensInput * 0.0000001) + (tokensOutput * 0.0000004),
        ip_origem: req.headers.get('x-forwarded-for') ?? 'desconhecido',
        sucesso: true
      })

      const geminiData = JSON.parse(resultText.replace(/```json|```/g, ''))
      
      // Gerenciar Animal e Salvar Consulta (Lógica simplificada para a Edge Function)
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
