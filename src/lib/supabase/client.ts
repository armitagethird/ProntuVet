import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const logToAdmin = async (type: string, message: string, details: any, source: string) => {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, message, details, source })
            })
        } catch (e) {}
    }

    // [DEBUG LOGGING] Interceptador para Client Components (Navegador)
    const originalGetUser = supabase.auth.getUser.bind(supabase.auth)
    supabase.auth.getUser = async (jwt?: string) => {
        try {
            const result = await originalGetUser(jwt)
            if (result.error) {
                console.error('\n🔴 [SUPABASE BROWSER ERROR RETORNADO] auth.getUser()')
                console.error('Mensagem:', result.error.message)
                logToAdmin('ERROR', '[BROWSER] auth.getUser() Error', result.error, 'client.ts')
            }
            return result
        } catch (error: any) {
            console.error('\n🔴 [SUPABASE BROWSER CRASH] Exceção em auth.getUser()')
            console.error('Detalhes:', error)
            logToAdmin('ERROR', '[BROWSER] auth.getUser() Fatal Crash', error?.stack || error, 'client.ts')
            return { data: { user: null }, error }
        }
    }

    const originalGetSession = supabase.auth.getSession.bind(supabase.auth)
    supabase.auth.getSession = async () => {
        try {
            const result = await originalGetSession()
            if (result.error) {
                console.error('\n🔴 [SUPABASE BROWSER ERROR RETORNADO] auth.getSession()')
                console.error('Mensagem:', result.error.message)
                logToAdmin('ERROR', '[BROWSER] auth.getSession() Error', result.error, 'client.ts')
            }
            return result
        } catch (error: any) {
            console.error('\n🔴 [SUPABASE BROWSER CRASH] Exceção em auth.getSession()')
            console.error('Detalhes:', error)
            logToAdmin('ERROR', '[BROWSER] auth.getSession() Fatal Crash', error?.stack || error, 'client.ts')
            return { data: { session: null }, error }
        }
    }

    return supabase
}
