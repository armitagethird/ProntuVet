import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { cancelarAssinatura } from '@/lib/asaas'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * DELETE /api/lgpd/delete-account
 *
 * Direito de eliminação (Art. 18, VI, LGPD).
 *
 * 1) Cancela assinatura Asaas se existir
 * 2) Remove anexos do Storage
 * 3) Apaga usuário via admin API — cascade remove profile, animals,
 *    consultations, uso_consultas, anexos, templates.
 *
 * A migração 20260423_lgpd_cascades.sql garante as FKs com ON DELETE CASCADE.
 */
export async function DELETE(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Ação irreversível: bucket 'strict' (3/min).
    const limited = await checkRateLimit(req, 'strict', `user:${user.id}`)
    if (limited) return limited

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    try {
        // 1) Cancela Asaas (tolerante a erro — não bloquear exclusão)
        const { data: profile } = await admin
            .from('profiles')
            .select('asaas_subscription_id')
            .eq('id', user.id)
            .maybeSingle()

        if (profile?.asaas_subscription_id) {
            await cancelarAssinatura(profile.asaas_subscription_id).catch((err) => {
                console.error('[lgpd/delete] Falha ao cancelar Asaas:', err)
            })
        }

        // 2) Remove anexos do Storage
        const { data: anexos } = await admin
            .from('anexos_consulta')
            .select('storage_path')
            .eq('user_id', user.id)

        if (anexos && anexos.length > 0) {
            const paths = anexos.map((a) => a.storage_path).filter(Boolean)
            if (paths.length > 0) {
                await admin.storage.from('medical-attachments').remove(paths)
            }
        }

        // Avatar (bucket separado)
        await admin.storage
            .from('avatars')
            .list(user.id)
            .then(async ({ data }) => {
                if (data && data.length > 0) {
                    await admin.storage
                        .from('avatars')
                        .remove(data.map((f) => `${user.id}/${f.name}`))
                }
            })
            .catch(() => {})

        // 3) Apaga auth user — cascade cuida das tabelas dependentes
        const { error } = await admin.auth.admin.deleteUser(user.id)
        if (error) throw error

        // Encerra a sessão do lado do cliente
        await supabase.auth.signOut()

        return NextResponse.json({ success: true })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao excluir conta'
        console.error('[lgpd/delete] Erro:', err)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
