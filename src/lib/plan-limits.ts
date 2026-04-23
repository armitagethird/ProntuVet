/**
 * Fonte única da verdade para limites de plano.
 *
 * Espelhado em supabase/functions/process-consultation/index.ts — mantenha
 * sincronizado: os limites são aplicados no servidor (Edge Function), este
 * arquivo existe apenas para alimentar a UI.
 */

export type Plano = 'free' | 'essential' | 'platinum' | 'clinica'

export interface PlanLimits {
    monthly: number
    daily: number
    hourly: number
}

export const PLAN_LIMITS: Record<Plano, PlanLimits> = {
    free:      { monthly: 20,  daily: 15, hourly: 5  },
    essential: { monthly: 80,  daily: 20, hourly: 15 },
    platinum:  { monthly: 200, daily: 20, hourly: 25 },
    clinica:   { monthly: 600, daily: 60, hourly: 40 },
}

export function getMonthlyLimit(plano: string | null | undefined): number {
    const key = (plano as Plano) in PLAN_LIMITS ? (plano as Plano) : 'free'
    return PLAN_LIMITS[key].monthly
}

export function getPlanLimits(plano: string | null | undefined): PlanLimits {
    const key = (plano as Plano) in PLAN_LIMITS ? (plano as Plano) : 'free'
    return PLAN_LIMITS[key]
}
