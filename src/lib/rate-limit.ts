/**
 * Rate limiting centralizado para rotas de API.
 *
 * Backend: Upstash Redis (serverless-native, compatível com Vercel Edge).
 * Algoritmo: sliding window (mais justo que fixed window, previne bursts na borda).
 *
 * Fail-open por design: se UPSTASH_REDIS_REST_URL não estiver configurado
 * (ex: desenvolvimento local), os limiters retornam `success: true` sem bloquear.
 * Isso evita quebrar o desenvolvimento local enquanto mantém proteção em produção.
 *
 * Buckets:
 * - auth:     5 req / 60s   — login, signup, recuperação de senha
 * - mutation: 30 req / 60s  — POST/PATCH/DELETE de rotas autenticadas
 * - ai:       20 req / 60s  — rotas que chamam Gemini (custo por token)
 * - strict:   3  req / 60s  — ações irreversíveis (delete-account, cancelar)
 * - read:     120 req / 60s — GETs autenticados
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = url && token ? new Redis({ url, token }) : null

if (!redis && process.env.NODE_ENV === 'production') {
    console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL ausente em produção. Rate limiting DESATIVADO.',
    )
}

type Bucket = 'auth' | 'mutation' | 'ai' | 'strict' | 'read'

const limiters: Record<Bucket, Ratelimit | null> = redis
    ? {
          auth:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,   '60 s'), prefix: 'rl:auth',     analytics: true }),
          mutation: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30,  '60 s'), prefix: 'rl:mutation', analytics: true }),
          ai:       new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20,  '60 s'), prefix: 'rl:ai',       analytics: true }),
          strict:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3,   '60 s'), prefix: 'rl:strict',   analytics: true }),
          read:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, '60 s'), prefix: 'rl:read',     analytics: true }),
      }
    : { auth: null, mutation: null, ai: null, strict: null, read: null }

/**
 * Extrai o identificador para rate limiting.
 * Prioridade: userId explícito > x-forwarded-for > x-real-ip > 'anon'.
 * Quando em Vercel, x-forwarded-for é o IP real do cliente (setado pela borda).
 */
export function getRateLimitIdentifier(req: NextRequest, userId?: string | null): string {
    if (userId) return `user:${userId}`

    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
        // Pode vir como "client, proxy1, proxy2" — o primeiro é o real
        const ip = forwarded.split(',')[0].trim()
        if (ip) return `ip:${ip}`
    }

    const realIp = req.headers.get('x-real-ip')
    if (realIp) return `ip:${realIp}`

    return 'ip:anon'
}

/**
 * Aplica rate limiting e retorna:
 * - null se liberado (ou se Redis não configurado)
 * - NextResponse 429 se bloqueado
 *
 * Uso:
 * ```ts
 * const limited = await checkRateLimit(req, 'strict', `user:${user.id}`)
 * if (limited) return limited
 * ```
 */
export async function checkRateLimit(
    req: NextRequest,
    bucket: Bucket,
    identifier: string,
): Promise<NextResponse | null> {
    const limiter = limiters[bucket]
    if (!limiter) return null // fail-open em dev

    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    if (success) return null

    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    return NextResponse.json(
        {
            error: 'Muitas requisições. Tente novamente em alguns instantes.',
            retryAfter: retryAfterSeconds,
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfterSeconds),
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(remaining),
                'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
            },
        },
    )
}

/** Helper conveniente: identifier por IP (rotas não autenticadas). */
export async function rateLimitByIp(req: NextRequest, bucket: Bucket) {
    return checkRateLimit(req, bucket, getRateLimitIdentifier(req))
}

/** Helper conveniente: identifier por userId. */
export async function rateLimitByUser(req: NextRequest, bucket: Bucket, userId: string) {
    return checkRateLimit(req, bucket, `user:${userId}`)
}
