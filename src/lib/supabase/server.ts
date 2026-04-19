import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const logToAdmin = async (type: string, message: string, details: any, source: string) => {
        try {
            await fetch('http://localhost:3000/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, message, details, source })
            })
        } catch (e) {}
    }

    // [DEBUG LOGGING] Interceptador Global para Erros de Autenticação (Ex: ES256)
    const originalGetUser = supabase.auth.getUser.bind(supabase.auth)
    supabase.auth.getUser = async (jwt?: string) => {
        try {
            const result = await originalGetUser(jwt)
            if (result.error) {
                console.error('\n🔴 [SUPABASE SERVER ERROR RETORNADO] auth.getUser()')
                console.error('Mensagem:', result.error.message)
                console.error('Completo:', JSON.stringify(result.error, null, 2))
                await logToAdmin('ERROR', '[SERVER] auth.getUser() Error', result.error, 'server.ts')
            }
            return result
        } catch (error: any) {
            console.error('\n🔴 [SUPABASE SERVER CRASH] Exceção fatal em auth.getUser()')
            console.error('Detalhes:', error)
            await logToAdmin('ERROR', '[SERVER] auth.getUser() Fatal Crash', error?.stack || error, 'server.ts')
            return { data: { user: null }, error }
        }
    }

    const originalGetSession = supabase.auth.getSession.bind(supabase.auth)
    supabase.auth.getSession = async () => {
        try {
            const result = await originalGetSession()
            if (result.error) {
                console.error('\n🔴 [SUPABASE SERVER ERROR RETORNADO] auth.getSession()')
                console.error('Mensagem:', result.error.message)
                console.error('Completo:', JSON.stringify(result.error, null, 2))
                await logToAdmin('ERROR', '[SERVER] auth.getSession() Error', result.error, 'server.ts')
            }
            return result
        } catch (error: any) {
            console.error('\n🔴 [SUPABASE SERVER CRASH] Exceção fatal em auth.getSession()')
            console.error('Detalhes:', error)
            await logToAdmin('ERROR', '[SERVER] auth.getSession() Fatal Crash', error?.stack || error, 'server.ts')
            return { data: { session: null }, error }
        }
    }

    return supabase
}
