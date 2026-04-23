import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimitByIp } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
    // Rota pública (tutor acessa sem auth). Rate limit por IP previne scraping.
    const limited = await rateLimitByIp(request, 'read')
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const path = searchParams.get('path')

    if (!token || !path) {
        return new NextResponse('Bad Request', { status: 400 })
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
    if (!isUuid) {
        return new NextResponse('Forbidden', { status: 403 })
    }

    if (path.includes('..') || path.startsWith('/')) {
        return new NextResponse('Forbidden', { status: 403 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: consultation } = await supabase
        .from('consultations')
        .select('id, user_id')
        .eq('tutor_token', token)
        .gt('tutor_token_expires_at', new Date().toISOString())
        .is('tutor_token_revoked_at', null)
        .maybeSingle()

    if (!consultation) {
        return new NextResponse('Forbidden', { status: 403 })
    }

    if (!path.startsWith(consultation.user_id + '/')) {
        return new NextResponse('Forbidden', { status: 403 })
    }

    const { data: signedUrl, error } = await supabase
        .storage
        .from('medical-attachments')
        .createSignedUrl(path, 3600)

    if (error || !signedUrl) {
        return new NextResponse('Not Found', { status: 404 })
    }

    return NextResponse.redirect(signedUrl.signedUrl)
}
