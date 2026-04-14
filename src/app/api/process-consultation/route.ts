import { NextRequest, NextResponse } from 'next/server'

/**
 * @deprecated
 * Esta rota foi desativada em favor da Supabase Edge Function 'process-consultation'.
 * Motivo: Centralização de segurança 'Zero Trust', monitoramento de custos (tokens) 
 * e validação de limites server-side direto na infraestrutura do banco de dados.
 * 
 * Localização atual: supabase/functions/process-consultation/index.ts
 * Chamada frontend: src/components/audio-recorder.tsx -> fetch(edgeFunctionUrl)
 */

export async function POST(req: NextRequest) {
    return NextResponse.json({ 
        error: 'Esta API foi descontinuada.',
        message: 'O processamento de consultas agora é realizado via Supabase Edge Functions para maior segurança e controle de custos.'
    }, { status: 410 }) // Gone
}


