import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cancelarAssinatura } from '@/lib/asaas'
import { checkRateLimit } from '@/lib/rate-limit'

export async function DELETE(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ erro: 'Token inválido' }, { status: 401 })
  }

  const limited = await checkRateLimit(req, 'strict', `user:${user.id}`)
  if (limited) return limited

  // 1. Buscar o ID da assinatura no perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('asaas_subscription_id, plano')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ erro: 'Perfil não encontrado' }, { status: 404 })
  }

  if (profile.plano !== 'platinum' || !profile.asaas_subscription_id) {
    return NextResponse.json({ erro: 'Nenhuma assinatura ativa encontrada para cancelamento.' }, { status: 400 })
  }

  try {
    // 2. Chamar API do Asaas para cancelar
    await cancelarAssinatura(profile.asaas_subscription_id)

    // 3. Atualizar banco de dados local imediatamente (Downgrade)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plano: 'free',
        asaas_subscription_id: null,
        data_vencimento: null,
        status: 'cancelado'
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar perfil após cancelamento:', updateError)
      // Mesmo com erro no DB, o cancelamento no Asaas foi feito. 
      // O webhook deve sincronizar isso eventualmente, mas avisamos o erro.
    }

    return NextResponse.json({ 
      mensagem: 'Assinatura cancelada com sucesso.',
      plano: 'free'
    })

  } catch (err: any) {
    console.error('Erro no fluxo de cancelamento:', err.message)
    return NextResponse.json(
      { erro: err.message || 'Erro ao processar cancelamento no Asaas.' },
      { status: 400 }
    )
  }
}
