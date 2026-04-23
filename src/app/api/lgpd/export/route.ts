import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/lgpd/export
 *
 * Direito de acesso e portabilidade (Art. 18, II e V, LGPD).
 * Devolve um JSON com todos os dados do titular autenticado.
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Export é pesado (várias queries + download grande). 3/min por usuário.
    const limited = await checkRateLimit(req, 'strict', `user:${user.id}`)
    if (limited) return limited

    const [profile, animals, consultations, anexos, uso, templates] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('animals').select('*').eq('user_id', user.id),
        supabase.from('consultations').select('*').eq('user_id', user.id),
        supabase.from('anexos_consulta').select('*').eq('user_id', user.id),
        supabase.from('uso_consultas').select('*').eq('user_id', user.id),
        supabase.from('consultation_templates').select('*').eq('user_id', user.id),
    ])

    const payload = {
        exported_at: new Date().toISOString(),
        auth_user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
        },
        profile: profile.data,
        animals: animals.data ?? [],
        consultations: consultations.data ?? [],
        anexos: anexos.data ?? [],
        uso_consultas: uso.data ?? [],
        consultation_templates: templates.data ?? [],
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="prontuvet-dados-${user.id}-${new Date().toISOString().slice(0,10)}.json"`,
            'Cache-Control': 'no-store',
        },
    })
}
