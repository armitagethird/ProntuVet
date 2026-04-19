import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase público/anônimo para rotas de compartilhamento (ex: /acompanhe/[token]).
 *
 * Não lê cookies: a sessão sempre roda como role `anon`, o que garante que as RLS policies
 * de leitura pública (ex: "Anon pode ler consulta por token valido") sejam as únicas a aplicar —
 * inclusive quando um usuário autenticado abre o link no próprio navegador.
 *
 * Segurança: o acesso depende exclusivamente do token UUID na URL (128 bits de entropia)
 * + expiração da RLS policy. Nenhum dado do usuário autenticado vaza para essa rota.
 */
export function createPublicClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        }
    )
}
