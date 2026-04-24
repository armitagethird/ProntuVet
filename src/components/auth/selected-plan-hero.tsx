'use client'

import { Check, Shield, Star, Zap, Building2, type LucideIcon } from 'lucide-react'
import { PRICING, formatPrice } from '@/lib/plan-pricing'
import type { Plano } from '@/lib/plan-limits'

interface SelectedPlanHeroProps {
    plano: Plano
    ciclo: 'monthly' | 'annual'
}

interface HeroMeta {
    name: string
    icon: LucideIcon
    features: string[]
    gradient: string
    priceColor: string
    accent: string
}

const HERO_META: Record<Plano, HeroMeta> = {
    free: {
        name: 'Free',
        icon: Shield,
        features: ['20 consultas por mês', '1 template próprio', 'Resumo pro tutor', 'Sem cartão de crédito'],
        gradient: 'from-slate-800 to-slate-900',
        priceColor: 'text-white',
        accent: 'text-slate-300',
    },
    essential: {
        name: 'Essential',
        icon: Star,
        features: ['80 consultas por mês', 'Templates ilimitados', 'Timeline clínica', 'Anexos até 25 MB', 'Suporte por e-mail'],
        gradient: 'from-teal-900/80 to-slate-900',
        priceColor: 'text-white',
        accent: 'text-teal-300',
    },
    platinum: {
        name: 'Platinum',
        icon: Zap,
        features: ['200 consultas por mês', 'ProntuLink — link do prontuário', 'Templates ilimitados', 'Timeline clínica completa', 'Anexos até 200 MB', 'Suporte prioritário'],
        gradient: 'from-slate-700 via-slate-800 to-slate-950',
        priceColor: 'text-slate-100',
        accent: 'text-slate-200',
    },
    clinica: {
        name: 'Clínica',
        icon: Building2,
        features: ['600 consultas por mês', 'Múltiplos veterinários', 'Tudo do Platinum', 'ProntuLink avançado', 'Gestão de equipe', 'Suporte via WhatsApp'],
        gradient: 'from-violet-950 to-slate-950',
        priceColor: 'text-violet-100',
        accent: 'text-violet-300',
    },
}

export function SelectedPlanHero({ plano, ciclo }: SelectedPlanHeroProps) {
    const meta = HERO_META[plano]
    const Icon = meta.icon

    const isPaid = plano !== 'free'
    const monthly = isPaid ? PRICING[plano as 'essential' | 'platinum' | 'clinica'][ciclo] : 0
    const priceLabel = isPaid
        ? `R$ ${formatPrice(monthly)}`
        : 'R$ 0'
    const priceSuffix = isPaid
        ? (ciclo === 'annual' ? '/mês · cobrado anualmente' : '/mês')
        : 'para sempre'

    return (
        <div className={`relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br ${meta.gradient} p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700`}>
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute top-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[100px]" />
            </div>

            <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60 mb-4">
                    Você está prestes a assinar
                </p>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
                        <Icon className={`h-7 w-7 ${meta.accent}`} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight text-white">
                            {meta.name}
                        </h3>
                        <p className={`text-sm font-semibold ${meta.accent}`}>
                            Plano ProntuVet
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <p className={`text-5xl font-black tracking-tighter ${meta.priceColor}`}>
                        {priceLabel}
                    </p>
                    <p className="text-sm text-white/60 mt-1">{priceSuffix}</p>
                </div>

                <ul className="space-y-2.5 mb-6">
                    {meta.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-white/90 leading-snug">
                            <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                            {f}
                        </li>
                    ))}
                </ul>

                <div className="pt-5 border-t border-white/10 text-xs text-white/50">
                    {isPaid
                        ? 'Cancele quando quiser. Sem fidelidade.'
                        : 'Gratuito para sempre. Faça upgrade quando quiser.'}
                </div>
            </div>
        </div>
    )
}
