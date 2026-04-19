import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const logToAdmin = async (type: string, message: string, details: any, source: string) => {
        try {
            await fetch(request.nextUrl.origin + '/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, message, details, source })
            })
        } catch (e) {}
    }

    // [DEBUG LOGGING] Interceptador para a Middleware (Edge Runtime)
    const originalGetUser = supabase.auth.getUser.bind(supabase.auth)
    supabase.auth.getUser = async (jwt?: string) => {
        try {
            const result = await originalGetUser(jwt)
            if (result.error && result.error.message !== 'Auth session missing!') {
                console.error('\n🔴 [SUPABASE MIDDLEWARE ERROR RETORNADO] auth.getUser()')
                console.error('Mensagem:', result.error.message)
                console.error('Completo:', JSON.stringify(result.error, null, 2))
                await logToAdmin('ERROR', '[MIDDLEWARE] auth.getUser() Error', result.error, 'middleware.ts')
            }
            return result
        } catch (error: any) {
            console.error('\n🔴 [SUPABASE MIDDLEWARE CRASH] Exceção em auth.getUser()')
            console.error('Detalhes:', error)
            await logToAdmin('ERROR', '[MIDDLEWARE] auth.getUser() Fatal Crash', error?.stack || error, 'middleware.ts')
            return { data: { user: null }, error }
        }
    }

    const originalGetSession = supabase.auth.getSession.bind(supabase.auth)
    supabase.auth.getSession = async () => {
        try {
            const result = await originalGetSession()
            if (result.error && result.error.message !== 'Auth session missing!') {
                console.error('\n🔴 [SUPABASE MIDDLEWARE ERROR RETORNADO] auth.getSession()')
                console.error('Mensagem:', result.error.message)
                console.error('Completo:', JSON.stringify(result.error, null, 2))
                await logToAdmin('ERROR', '[MIDDLEWARE] auth.getSession() Error', result.error, 'middleware.ts')
            }
            return result
        } catch (error: any) {
            console.error('\n🔴 [SUPABASE MIDDLEWARE CRASH] Exceção em auth.getSession()')
            console.error('Detalhes:', error)
            await logToAdmin('ERROR', '[MIDDLEWARE] auth.getSession() Fatal Crash', error?.stack || error, 'middleware.ts')
            return { data: { session: null }, error }
        }
    }

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // HIGH PERFORMANCE: For middleware-level navigation redirects, we use getUser()
    // to strictly fetch from the network/API and avoid fatal Edge Cryptography (jose)
    // bugs associated with local ES256 asymmetric signature parsing.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/acompanhe') &&
        request.nextUrl.pathname !== '/'
    ) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If the user is logged in and trying to access /login or /
    // redirect them to the dashboard
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
