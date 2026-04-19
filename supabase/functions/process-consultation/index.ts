import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { GoogleGenerativeAI, SchemaType } from 'https://esm.sh/@google/generative-ai@0.21.0'

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

    // 1. Autenticação do Usuário (Bypass do bug ES256 via Fetch Direto)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })

    const token = authHeader.replace('Bearer ', '')
    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseServiceKey,
      }
    })
    
    if (!authRes.ok) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: corsHeaders })
    const user = await authRes.json()
    if (!user || !user.id) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: corsHeaders })

    // 2. Buscar Perfil (Status e Plano)
    const { data: profile } = await supabase.from('profiles').select('status, plano').eq('id', user.id).single()
    
    if (!profile || profile.status === 'bloqueado') {
      return new Response(JSON.stringify({ error: 'Sua assinatura está inativa ou bloqueada.' }), { status: 403, headers: corsHeaders })
    }

    type PlanoType = 'free' | 'platinum'
    const plano: PlanoType = (profile.plano as PlanoType) || 'free'

    // 3. Configuração de Limites por Plano
    const limitsConfig: Record<PlanoType, { monthly: number; daily: number; hourly: number }> = {
      free: { monthly: 20, daily: 15, hourly: 5 },
      platinum: { monthly: 200, daily: 20, hourly: 25 }
    }
    const limits = limitsConfig[plano] || limitsConfig.free

    // 4. Verificação de Limites (Mês, Dia, Hora)
    const offsetHours = -3
    const tzOffsetMs = offsetHours * 60 * 60 * 1000
    const now = new Date()
    const nowBR = new Date(now.getTime() + tzOffsetMs)
    
    // Mês atual no horário de Brasília (UTC-3) -> equivale às 03:00 UTC
    const inicioMes = new Date(Date.UTC(nowBR.getUTCFullYear(), nowBR.getUTCMonth(), 1, -offsetHours, 0, 0)).toISOString()
    const { count: monthCount } = await supabase.from('uso_consultas').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('sucesso', true).gte('data_consulta', inicioMes)
    
    if ((monthCount || 0) >= limits.monthly) {
      return new Response(JSON.stringify({ 
        error: `Limite mensal de ${limits.monthly} consultas atingido para o plano ${plano}.`,
        message: 'Fale com o suporte para upgrade.' 
      }), { status: 429, headers: corsHeaders })
    }

    // Dia atual no horário de Brasília
    const inicioDia = new Date(Date.UTC(nowBR.getUTCFullYear(), nowBR.getUTCMonth(), nowBR.getUTCDate(), -offsetHours, 0, 0)).toISOString()
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
        systemInstruction: `Você é um assistente veterinário de elite e um auditor implacável.
REGRAS CRÍTICAS CONTRA ALUCINAÇÃO:
1. Você deve primeiro avaliar o áudio como um auditor médico. Ele trata de uma consulta veterinária válida?
2. Se o áudio for silencioso, ruidoso, ininteligível, ou contiver assuntos totalmente nulos (como receita de bolo, ou pessoas testando mic), defina 'is_valid_consultation' = false. E preencha 'rejection_reason' com o que foi ouvido.
3. Se for válido, extraia os dados biológicos e clínicos rigorosamente.
4. NUNCA crie ou infira o nome do cachorro ou os sintomas se não foram explicitamente mencionados. Retorne vazio se não existir.
5. O campo 'prontuario' DEVE ser uma lista (ARRAY) de objetos, onde cada objeto tem 'secao' (título do template) e 'conteudo' (texto extraído).
6. Você DEVE gerar resumos globais (tutor_summary, vet_summary e resumo_trilha) baseados na consulta inteira, além da lista detalhada no prontuário.`,
        generationConfig: {
            temperature: 0.1, // Determinismo mecânico absoluto
            topK: 16,
            topP: 0.3,
            responseMimeType: "application/json",
            // responseSchema corrigido para forçar a geração de resumos
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    is_valid_consultation: { type: SchemaType.BOOLEAN, description: "True se for uma consulta veterinária audível e coerente." },
                    confidence_score: { type: SchemaType.NUMBER, description: "De 0 a 100 quão legível foi o áudio clínico." },
                    rejection_reason: { type: SchemaType.STRING, description: "Se inválido, explicar por quê." },
                    animal_name: { type: SchemaType.STRING, nullable: true },
                    animal_species: { type: SchemaType.STRING, nullable: true },
                    tutor_name: { type: SchemaType.STRING, nullable: true },
                    tutor_summary: { type: SchemaType.STRING, description: "Resumo amigável e acolhedor para o tutor." },
                    vet_summary: { type: SchemaType.STRING, description: "Resumo técnico clínico para o veterinário." },
                    resumo_trilha: { type: SchemaType.STRING, description: "Resumo ultra-compacto de 2 linhas para a listagem." },
                    transcription: { type: SchemaType.STRING, description: "Transcrição fiel do áudio." },
                    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
                    prontuario: { 
                        type: SchemaType.ARRAY, 
                        description: "Lista de seções clínicas extraídas.",
                        items: {
                          type: SchemaType.OBJECT,
                          properties: {
                            secao: { type: SchemaType.STRING, description: "Título da seção conforme o template." },
                            conteudo: { type: SchemaType.STRING, description: "Conteúdo clínico extraído para esta seção." }
                          },
                          required: ["secao", "conteudo"]
                        },
                        nullable: true 
                    }
                },
                required: ["is_valid_consultation", "confidence_score", "transcription", "tutor_summary", "vet_summary", "resumo_trilha", "prontuario"]
            }
        }
    })


    const arrayBuffer = await audioFile.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ""
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunkSize)))
    }
    const audioBase64 = btoa(binary)

    try {
      const result = await model.generateContent([
        { inlineData: { data: audioBase64, mimeType: audioFile.type || 'audio/webm' } },
        { text: `Gere o prontuário preenchendo todos os campos do esquema JSON. Baseie sua extração clínica neste template caso seja válido:\n${templateContent}\n\nPreze pela máxima confiabilidade. Se não escutar uma consulta, is_valid_consultation = false.` }
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
      
      // Validação Absoluta de Quebra de Confiança (Anti-Alucinação Nível 1, 2 e 3)
      if (geminiData.is_valid_consultation === false) {
          throw new Error(`Áudio rejeitado. Motivo: ${geminiData.rejection_reason || 'Ininteligível ou fala fora de contexto veterinário.'} Tente novamente.`)
      }

      if (geminiData.confidence_score < 30) {
          throw new Error("Não foi possível prosseguir com a escuta. O áudio parece estar muito ruidoso para ser útil.")
      }

      if (!geminiData.transcription || geminiData.transcription.trim().length <= 5) {
          throw new Error("Não foi possível prosseguir com a escuta. Nenhum áudio detectado.")
      }

      // NOVO: Converter o ARRAY do prontuário em OBJETO para manter compatibilidade com DB e Frontend
      const structuredObject: Record<string, string> = {}
      if (Array.isArray(geminiData.prontuario)) {
        geminiData.prontuario.forEach((item: any) => {
          if (item.secao && item.conteudo) {
            structuredObject[item.secao] = item.conteudo
          }
        })
      }

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
        structured_content: structuredObject, // Usar o objeto convertido aqui
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

    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      await supabase.from('uso_consultas').insert({ user_id: user.id, sucesso: false, erro: errorMsg, ip_origem: req.headers.get('x-forwarded-for') ?? 'desconhecido' })
      throw err
    }

  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    
    // Envia status 400 para erros normais para na UI ficar mais clean
    const status = errorMsg.includes("Não foi possível prosseguir com a escuta") ? 400 : 500

    return new Response(JSON.stringify({ error: errorMsg }), {
      status: status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
