import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { criarCheckoutAssinatura, type PlanoCheckout } from '@/lib/asaas'
import { checkRateLimit } from '@/lib/rate-limit'

const PLANOS_VALIDOS: PlanoCheckout[] = ['essential', 'platinum', 'clinica']

export async function POST(req: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Rate limit: 3 tentativas de checkout por minuto (previne abuso da API do Asaas)
    const limited = await checkRateLimit(req, 'strict', `user:${user.id}`)
    if (limited) return limited

    const { data: p } = await supabase
        .from('profiles')
        .select('first_name, last_name, cpf, telefone, cep, endereco, numero, bairro, complemento')
        .eq('id', user.id)
        .single()

    if (!p?.cpf || !p?.cep || !p?.endereco || !p?.numero) {
        return NextResponse.json(
            { erro: 'Dados de faturamento incompletos. Por favor, preencha o formulário.' },
            { status: 400 },
        )
    }

    const body = await req.json().catch(() => ({}))
    const plano: PlanoCheckout = PLANOS_VALIDOS.includes(body.plano) ? body.plano : 'platinum'

    const nome = `${p.first_name || ''} ${p.last_name || ''}`.trim() || user.email!.split('@')[0]

    // Plano Clínica exige organização existente onde o usuário é owner/admin.
    let target: string | { kind: 'user' | 'organization'; id: string } = user.id
    if (plano === 'clinica') {
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .maybeSingle()

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json(
                { erro: 'Crie uma clínica em /clinica antes de assinar o plano Clínica.' },
                { status: 400 },
            )
        }
        target = { kind: 'organization', id: membership.organization_id }
    }

    try {
        const paymentLink = await criarCheckoutAssinatura(
            target,
            {
                nome,
                email: user.email!,
                cpf: p.cpf,
                phone: p.telefone || '',
                postalCode: p.cep,
                address: p.endereco,
                addressNumber: p.numero,
                province: p.bairro || '',
                complement: p.complemento || '',
            },
            plano,
        )

        return NextResponse.json({ paymentLink })
    } catch (err: any) {
        console.error('Erro ao criar checkout Asaas:', err.message)
        return NextResponse.json(
            { erro: err.message || 'Erro ao gerar link de pagamento no Asaas.' },
            { status: 400 },
        )
    }
}
