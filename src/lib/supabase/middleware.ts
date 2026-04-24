import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth', '/acompanhe', '/termos', '/privacidade', '/clinica/aceitar']

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANTE: nenhuma lógica entre createServerClient e getUser().
    // getUser() força ida à rede, evitando o bug de verificação ES256 em Edge runtime.
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === '/'

    if (!user && !isPublic) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.search = ''
        url.searchParams.set('redirect', pathname + request.nextUrl.search)
        return NextResponse.redirect(url)
    }

    if (user && (pathname === '/login' || pathname === '/')) {
        const redirectParam = request.nextUrl.searchParams.get('redirect')
        const url = request.nextUrl.clone()
        url.search = ''
        if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
            const target = new URL(redirectParam, request.nextUrl.origin)
            url.pathname = target.pathname
            url.search = target.search
        } else {
            url.pathname = '/dashboard'
        }
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
