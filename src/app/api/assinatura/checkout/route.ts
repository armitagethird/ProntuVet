import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { criarCheckoutAssinatura } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ erro: 'Token inválido' }, { status: 401 })
  }

  // Buscar dados do perfil completos para o Asaas
  const { data: p } = await supabase
    .from('profiles')
    .select('first_name, last_name, cpf, telefone, cep, endereco, numero, bairro, complemento')
    .eq('id', user.id)
    .single()

  if (!p?.cpf || !p?.cep || !p?.endereco || !p?.numero) {
    console.log('Dados incompletos no banco:', { cpf: p?.cpf, cep: p?.cep, end: p?.endereco, num: p?.numero })
    return NextResponse.json(
      { erro: 'Dados de faturamento incompletos. Por favor, preencha o formulário.' },
      { status: 400 }
    )
  }

  const nome = `${p.first_name || ''} ${p.last_name || ''}`.trim() || user.email!.split('@')[0]

  try {
    const paymentLink = await criarCheckoutAssinatura(user.id, {
      nome,
      email: user.email!, // Email vem do auth.user
      cpf: p.cpf,
      phone: p.telefone || '',
      postalCode: p.cep,
      address: p.endereco,
      addressNumber: p.numero,
      province: p.bairro || '',
      complement: p.complemento || '',
    })

    return NextResponse.json({ paymentLink })
  } catch (err: any) {
    console.error('Erro ao criar checkout Asaas:', err.message)
    return NextResponse.json(
      { erro: err.message || 'Erro ao gerar link de pagamento no Asaas.' },
      { status: 400 } // Retornamos 400 para que o frontend saiba que é um erro de validação/dados
    )
  }
}
