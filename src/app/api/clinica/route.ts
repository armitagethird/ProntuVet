import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const createSchema = z.object({
    nome: z.string().min(2, 'Nome muito curto').max(120),
})

/**
 * POST /api/clinica
 * Cria uma nova organização. O usuário autenticado vira `owner`.
 * Requer: não estar vinculado a nenhuma outra org.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const limited = await checkRateLimit(req, 'mutation', `user:${user.id}`)
    if (limited) return limited

    const body = await req.json().catch(() => ({}))
    const validation = createSchema.safeParse(body)
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    // Verifica se já é membro de alguma org
    const { data: existing } = await admin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (existing) {
        return NextResponse.json(
            { error: 'Você já pertence a uma clínica.' },
            { status: 409 },
        )
    }

    // Cria org + membership em sequência (sem transação cliente-lado, mas RLS admin é suficiente)
    const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert({
            nome: validation.data.nome,
            plano: 'clinica',
            status: 'ativo',
            created_by: user.id,
        })
        .select('id, nome')
        .single()

    if (orgError || !org) {
        console.error('[clinica] Erro criando org:', orgError)
        return NextResponse.json({ error: 'Erro ao criar clínica.' }, { status: 500 })
    }

    const { error: memberError } = await admin
        .from('organization_members')
        .insert({
            organization_id: org.id,
            user_id: user.id,
            role: 'owner',
        })

    if (memberError) {
        // Rollback: apaga org se membership falhar
        await admin.from('organizations').delete().eq('id', org.id)
        console.error('[clinica] Erro criando membership:', memberError)
        return NextResponse.json({ error: 'Erro ao vincular dono à clínica.' }, { status: 500 })
    }

    await admin
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', user.id)

    return NextResponse.json({ organization: org })
}

/**
 * GET /api/clinica
 * Retorna a organização do usuário autenticado, membros e convites pendentes.
 */
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!membership) return NextResponse.json({ organization: null })

    const [{ data: org }, { data: members }, { data: invites }] = await Promise.all([
        supabase
            .from('organizations')
            .select('id, nome, plano, status, data_vencimento, created_at')
            .eq('id', membership.organization_id)
            .single(),
        supabase
            .from('organization_members')
            .select('user_id, role, joined_at')
            .eq('organization_id', membership.organization_id),
        supabase
            .from('organization_invites')
            .select('id, email, role, expires_at, created_at')
            .eq('organization_id', membership.organization_id)
            .is('accepted_at', null),
    ])

    // Enriquece membros com nome/email usando admin (profiles + auth.users)
    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    const memberIds = (members ?? []).map((m) => m.user_id)
    const { data: profiles } = memberIds.length
        ? await admin
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', memberIds)
        : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    const enriched = await Promise.all(
        (members ?? []).map(async (m) => {
            const p = profileMap.get(m.user_id)
            const { data: authUser } = await admin.auth.admin.getUserById(m.user_id)
            return {
                user_id: m.user_id,
                role: m.role,
                joined_at: m.joined_at,
                name: [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Sem nome',
                email: authUser?.user?.email ?? null,
            }
        }),
    )

    return NextResponse.json({
        organization: org,
        members: enriched,
        invites: invites ?? [],
        currentUserRole: membership.role,
    })
}
