import type { Plano } from './plan-limits'

export type PaidPlano = Exclude<Plano, 'free'>
export type BillingCycle = 'monthly' | 'annual'

export const PRICING: Record<PaidPlano, Record<BillingCycle, number>> = {
    essential: { monthly: 34.90, annual: 27.90 },
    platinum:  { monthly: 69.90, annual: 55.90 },
    clinica:   { monthly: 149.90, annual: 119.90 },
}

export function formatPrice(value: number): string {
    return value.toFixed(2).replace('.', ',')
}

export function annualDiscount(plan: PaidPlano): number {
    return Math.round((1 - PRICING[plan].annual / PRICING[plan].monthly) * 100)
}

const VALID_PLANOS: readonly Plano[] = ['free', 'essential', 'platinum', 'clinica']

export function parsePlanFromRedirect(
    redirectTo: string | undefined | null,
): { plano: Plano; ciclo: BillingCycle } | null {
    if (!redirectTo || !redirectTo.startsWith('/assinatura')) return null
    try {
        const url = new URL(redirectTo, 'http://placeholder')
        const plano = url.searchParams.get('plano')
        if (!plano || !VALID_PLANOS.includes(plano as Plano)) return null
        const ciclo: BillingCycle = url.searchParams.get('ciclo') === 'annual' ? 'annual' : 'monthly'
        return { plano: plano as Plano, ciclo }
    } catch {
        return null
    }
}
