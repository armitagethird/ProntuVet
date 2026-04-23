import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const acceptSchema = z.object({
    token: z.string().uuid('Token inválido'),
})

/**
 * POST /api/clinica/accept
 * Usuário autenticado aceita um convite via token. Vincula à organização.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Bucket strict: previne brute-force em tokens de convite UUID.
    const limited = await checkRateLimit(req, 'strict', `user:${user.id}`)
    if (limited) return limited

    const body = await req.json().catch(() => ({}))
    const validation = acceptSchema.safeParse(body)
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    // Busca convite
    const { data: invite } = await admin
        .from('organization_invites')
        .select('id, organization_id, email, role, expires_at, accepted_at')
        .eq('token', validation.data.token)
        .maybeSingle()

    if (!invite) {
        return NextResponse.json({ error: 'Convite inválido ou não encontrado.' }, { status: 404 })
    }
    if (invite.accepted_at) {
        return NextResponse.json({ error: 'Convite já foi utilizado.' }, { status: 409 })
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Convite expirado.' }, { status: 410 })
    }

    // Valida e-mail do convite vs. usuário
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
        return NextResponse.json(
            { error: `Este convite é para ${invite.email}. Faça login com essa conta.` },
            { status: 403 },
        )
    }

    // Checa se já é membro de alguma org
    const { data: existing } = await admin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (existing) {
        return NextResponse.json(
            { error: 'Você já pertence a outra clínica. Saia da atual para aceitar.' },
            { status: 409 },
        )
    }

    // Cria membership
    const { error: memberError } = await admin
        .from('organization_members')
        .insert({
            organization_id: invite.organization_id,
            user_id: user.id,
            role: invite.role,
        })

    if (memberError) {
        console.error('[clinica/accept] Erro:', memberError)
        return NextResponse.json({ error: 'Erro ao aceitar convite.' }, { status: 500 })
    }

    // Marca convite aceito e atualiza profile.organization_id
    await Promise.all([
        admin
            .from('organization_invites')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invite.id),
        admin
            .from('profiles')
            .update({ organization_id: invite.organization_id })
            .eq('id', user.id),
    ])

    return NextResponse.json({
        success: true,
        organization_id: invite.organization_id,
    })
}
