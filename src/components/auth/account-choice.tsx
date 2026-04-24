'use client'

import { Button } from '@/components/ui/button'
import { PRICING, formatPrice, type PaidPlano } from '@/lib/plan-pricing'
import type { Plano } from '@/lib/plan-limits'
import { Shield, Star, Zap, Building2, type LucideIcon } from 'lucide-react'

interface AccountChoiceProps {
    selectedPlan: Plano
    onChoose: (choice: 'login' | 'signup') => void
}

const PLAN_META: Record<Plano, { name: string; icon: LucideIcon; priceLabel: string }> = {
    free:      { name: 'Free',      icon: Shield,     priceLabel: 'R$ 0 — para sempre' },
    essential: { name: 'Essential', icon: Star,       priceLabel: `R$ ${formatPrice(PRICING.essential.monthly)}/mês` },
    platinum:  { name: 'Platinum',  icon: Zap,        priceLabel: `R$ ${formatPrice(PRICING.platinum.monthly)}/mês` },
    clinica:   { name: 'Clínica',   icon: Building2,  priceLabel: `R$ ${formatPrice(PRICING.clinica.monthly)}/mês` },
}

export function AccountChoice({ selectedPlan, onChoose }: AccountChoiceProps) {
    const meta = PLAN_META[selectedPlan]
    const Icon = meta.icon

    return (
        <section
            aria-labelledby="account-choice-heading"
            className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm animate-in fade-in zoom-in-95 duration-300"
        >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/60">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Você escolheu</p>
                    <p className="text-sm font-bold text-foreground truncate">
                        Plano {meta.name} <span className="font-semibold text-muted-foreground">· {meta.priceLabel}</span>
                    </p>
                </div>
            </div>

            <h2 id="account-choice-heading" className="text-xl font-black tracking-tight text-foreground mb-1">
                Já tem conta no ProntuVet?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
                Escolha como continuar pra assinar.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onChoose('login')}
                    className="h-12 rounded-xl font-bold text-sm border-border/80 hover:border-primary hover:bg-primary/5 transition-all"
                >
                    Sim, entrar
                </Button>
                <Button
                    type="button"
                    onClick={() => onChoose('signup')}
                    className="h-12 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                    Criar conta grátis
                </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
                O cadastro leva cerca de 30 segundos.
            </p>
        </section>
    )
}
