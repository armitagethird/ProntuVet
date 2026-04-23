import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const idSchema = z.object({ id: z.string().uuid('ID inválido') })

/**
 * DELETE /api/clinica/invite/[id]
 * Revoga (deleta) um convite pendente. Apenas owner/admin.
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

    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json({ error: 'Apenas o responsável pode revogar convites.' }, { status: 403 })
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    const { error } = await admin
        .from('organization_invites')
        .delete()
        .eq('id', params.id)
        .eq('organization_id', membership.organization_id)

    if (error) {
        console.error('[clinica/invite/delete] Erro:', error)
        return NextResponse.json({ error: 'Erro ao revogar convite.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
