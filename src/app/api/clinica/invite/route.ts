import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const inviteSchema = z.object({
    email: z.string().email('E-mail inválido'),
    role: z.enum(['admin', 'vet']).default('vet'),
})

/**
 * POST /api/clinica/invite
 * Owner/admin convida um veterinário por e-mail. Gera um token UUID válido por 7 dias.
 * O link de aceitação deve ser enviado externamente (o projeto não tem SMTP próprio).
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const limited = await checkRateLimit(req, 'mutation', `user:${user.id}`)
    if (limited) return limited

    const body = await req.json().catch(() => ({}))
    const validation = inviteSchema.safeParse(body)
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json({ error: 'Apenas o responsável pode convidar.' }, { status: 403 })
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    const email = validation.data.email.trim().toLowerCase()

    // Impede reconvite duplicado pendente
    const { data: existingInvite } = await admin
        .from('organization_invites')
        .select('id, token, expires_at')
        .eq('organization_id', membership.organization_id)
        .ilike('email', email)
        .is('accepted_at', null)
        .maybeSingle()

    if (existingInvite && new Date(existingInvite.expires_at) > new Date()) {
        return NextResponse.json({
            invite: existingInvite,
            message: 'Já existe um convite ativo para este e-mail.',
        })
    }

    const { data: invite, error } = await admin
        .from('organization_invites')
        .insert({
            organization_id: membership.organization_id,
            email,
            role: validation.data.role,
            created_by: user.id,
        })
        .select('id, email, role, token, expires_at')
        .single()

    if (error || !invite) {
        console.error('[clinica/invite] Erro:', error)
        return NextResponse.json({ error: 'Erro ao criar convite.' }, { status: 500 })
    }

    const origin = req.headers.get('origin') ?? req.nextUrl.origin
    const inviteUrl = `${origin}/clinica/aceitar/${invite.token}`

    return NextResponse.json({ invite, inviteUrl })
}
