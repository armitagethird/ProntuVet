import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const idSchema = z.object({ id: z.string().uuid('ID inválido') })

/**
 * DELETE /api/clinica/member/[id]
 * Remove um membro da organização. Apenas owner/admin; owner não pode ser removido.
 * O próprio usuário pode sair da org chamando com seu próprio id.
 */
export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const params = await props.params
    const validation = idSchema.safeParse(params)
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const limited = await checkRateLimit(req, 'mutation', `user:${user.id}`)
    if (limited) return limited

    const { data: myMembership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!myMembership) {
        return NextResponse.json({ error: 'Você não pertence a uma clínica.' }, { status: 404 })
    }

    const isSelfRemoval = params.id === user.id
    const canManage = ['owner', 'admin'].includes(myMembership.role)

    if (!isSelfRemoval && !canManage) {
        return NextResponse.json(
            { error: 'Apenas o responsável pode remover membros.' },
            { status: 403 },
        )
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    const { data: target } = await admin
        .from('organization_members')
        .select('user_id, role, organization_id')
        .eq('organization_id', myMembership.organization_id)
        .eq('user_id', params.id)
        .maybeSingle()

    if (!target) {
        return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })
    }

    if (target.role === 'owner') {
        return NextResponse.json(
            { error: 'O responsável da clínica não pode ser removido.' },
            { status: 409 },
        )
    }

    const { error } = await admin
        .from('organization_members')
        .delete()
        .eq('organization_id', myMembership.organization_id)
        .eq('user_id', params.id)

    if (error) {
        console.error('[clinica/member/delete] Erro:', error)
        return NextResponse.json({ error: 'Erro ao remover membro.' }, { status: 500 })
    }

    // Limpa organization_id do profile removido
    await admin.from('profiles').update({ organization_id: null }).eq('id', params.id)

    return NextResponse.json({ success: true })
}
