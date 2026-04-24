"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { AccountChoice } from '@/components/auth/account-choice'
import { SelectedPlanHero } from '@/components/auth/selected-plan-hero'
import { PRICING, formatPrice, parsePlanFromRedirect } from '@/lib/plan-pricing'
import { Shield, Star, Zap, Building2, Check, ChevronLeft } from 'lucide-react'

interface PlanCard {
    id: 'free' | 'essential' | 'platinum' | 'clinica'
    name: string
    price: string
    priceSuffix: string
    features: string[]
    cta: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    accent: 'gray' | 'teal' | 'platinum' | 'purple'
    popular?: boolean
}

const PLAN_CARDS: PlanCard[] = [
    {
        id: 'free',
        name: 'Free',
        price: 'R$ 0',
        priceSuffix: 'para sempre',
        features: ['20 consultas/mês', '1 template próprio', 'Resumo para tutor'],
        cta: 'Começar grátis',
        href: '/login?tab=signup',
        icon: Shield,
        accent: 'gray',
    },
    {
        id: 'essential',
        name: 'Essential',
        price: `R$ ${formatPrice(PRICING.essential.monthly)}`,
        priceSuffix: '/mês',
        features: ['80 consultas/mês', 'Templates ilimitados', 'Timeline clínica'],
        cta: 'Assinar Essential',
        href: '/assinatura?plano=essential&ciclo=monthly',
        icon: Star,
        accent: 'teal',
    },
    {
        id: 'platinum',
        name: 'Platinum',
        price: `R$ ${formatPrice(PRICING.platinum.monthly)}`,
        priceSuffix: '/mês',
        features: ['200 consultas/mês', 'ProntuLink — link do prontuário', 'Suporte prioritário'],
        cta: 'Assinar Platinum',
        href: '/assinatura?plano=platinum&ciclo=monthly',
        icon: Zap,
        accent: 'platinum',
        popular: true,
    },
    {
        id: 'clinica',
        name: 'Clínica',
        price: `R$ ${formatPrice(PRICING.clinica.monthly)}`,
        priceSuffix: '/mês',
        features: ['600 consultas/mês', 'Múltiplos veterinários', 'Suporte via WhatsApp'],
        cta: 'Assinar Clínica',
        href: '/assinatura?plano=clinica&ciclo=monthly',
        icon: Building2,
        accent: 'purple',
    },
]

const ACCENT_STYLES: Record<PlanCard['accent'], { border: string; iconColor: string; badgeBg: string; price: string }> = {
    gray:     { border: 'border-white/10',                   iconColor: 'text-slate-300',  badgeBg: 'bg-white/5',                                             price: 'text-white' },
    teal:     { border: 'border-teal-400/40',                iconColor: 'text-teal-300',   badgeBg: 'bg-teal-400/10',                                         price: 'text-white' },
    platinum: { border: 'border-slate-200/50',               iconColor: 'text-slate-200',  badgeBg: 'bg-gradient-to-br from-slate-200/20 to-slate-400/10',    price: 'text-slate-100' },
    purple:   { border: 'border-violet-400/40',              iconColor: 'text-violet-300', badgeBg: 'bg-violet-400/10',                                       price: 'text-white' },
}

type View = 'choice' | 'login' | 'signup'

export default function LoginPage(props: { searchParams: { error?: string; redirect?: string; tab?: string } }) {
    const searchParams = props.searchParams
    const redirectTo = searchParams?.redirect && searchParams.redirect.startsWith('/') && !searchParams.redirect.startsWith('//')
        ? searchParams.redirect
        : undefined

    const checkoutIntent = parsePlanFromRedirect(redirectTo)
    const hasError = Boolean(searchParams?.error)

    const initialView: View = (() => {
        if (checkoutIntent && !hasError && searchParams?.tab !== 'login' && searchParams?.tab !== 'signup') {
            return 'choice'
        }
        if (searchParams?.tab === 'signup') return 'signup'
        return 'login'
    })()

    const [view, setView] = useState<View>(initialView)

    const inCheckoutMode = Boolean(checkoutIntent)

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-background overflow-x-hidden">
            {/* Esquerda — formulário */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in slide-in-from-left-8 duration-700 min-h-screen lg:min-h-0">
                <div className="w-full max-w-[440px] space-y-6">
                    {/* Header logo + title */}
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start mb-2">
                            <Image src="/logo.png" alt="ProntuVet Logo" width={88} height={88} className="object-contain drop-shadow-sm" priority />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            ProntuVet
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            O seu software veterinário inteligente
                        </p>
                    </div>

                    {/* Error banner */}
                    {searchParams?.error && (
                        <div role="alert" className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-4 text-sm text-destructive font-semibold shadow-sm animate-in fade-in">
                            {searchParams.error}
                        </div>
                    )}

                    {/* Main content */}
                    {inCheckoutMode && checkoutIntent ? (
                        // Checkout-intent mode: state machine
                        <>
                            {view === 'choice' && (
                                <AccountChoice
                                    selectedPlan={checkoutIntent.plano}
                                    onChoose={(c) => setView(c)}
                                />
                            )}

                            {view === 'login' && (
                                <div key="login-view" className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                    <BackButton onClick={() => setView('choice')} />
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">Entrar na sua conta</h2>
                                    <LoginForm
                                        redirectTo={redirectTo}
                                        autoFocus
                                        onSwitchToSignup={() => setView('signup')}
                                    />
                                </div>
                            )}

                            {view === 'signup' && (
                                <div key="signup-view" className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                    <BackButton onClick={() => setView('choice')} />
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">Criar sua conta</h2>
                                    <div className="bg-card p-5 rounded-2xl border shadow-sm">
                                        <SignupForm
                                            redirectTo={redirectTo}
                                            onSwitchToLogin={() => setView('login')}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Visita direta: tabs clássicas
                        <Tabs value={view === 'signup' ? 'signup' : 'login'} onValueChange={(v) => setView(v as View)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl mb-6">
                                <TabsTrigger value="login" className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                    Entrar
                                </TabsTrigger>
                                <TabsTrigger value="signup" className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                    Cadastro
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="login" className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <LoginForm redirectTo={redirectTo} autoFocus={view === 'login'} />
                            </TabsContent>

                            <TabsContent value="signup" className="animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-card p-6 rounded-2xl border shadow-sm">
                                    <SignupForm redirectTo={redirectTo} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}

                    {/* Footer — contato */}
                    <div className="text-center lg:text-left text-xs text-muted-foreground pt-2">
                        Dúvidas? Fale com a gente em{' '}
                        <a href="mailto:contato@prontuvet.com" className="font-semibold text-primary hover:underline">
                            contato@prontuvet.com
                        </a>
                    </div>

                    {/* Mobile scroll cue */}
                    <div className="flex lg:hidden flex-col items-center justify-center pt-2 animate-bounce text-muted-foreground/60">
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">
                            {inCheckoutMode ? 'Detalhes do plano' : 'Conheça os planos'}
                        </span>
                        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/40 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Direita — hero do plano escolhido ou grid de planos */}
            <div className="flex flex-col w-full lg:w-1/2 relative bg-slate-950 overflow-hidden p-8 sm:p-12 lg:p-16 min-h-[700px] lg:min-h-screen">
                <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
                    <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-teal-500/10 blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px]" />
                </div>

                <div className="relative z-10 w-full max-w-xl mx-auto my-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {inCheckoutMode && checkoutIntent ? (
                        <SelectedPlanHero plano={checkoutIntent.plano} ciclo={checkoutIntent.ciclo} />
                    ) : (
                        <>
                            <div className="text-center lg:text-left">
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-400 mb-2">Planos ProntuVet</p>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    Escolha seu plano
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    Cadastre-se grátis ou vá direto pro plano ideal.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {PLAN_CARDS.map(card => {
                                    const styles = ACCENT_STYLES[card.accent]
                                    const Icon = card.icon
                                    const isPlatinum = card.accent === 'platinum'
                                    const isPurple = card.accent === 'purple'
                                    return (
                                        <Link
                                            key={card.id}
                                            href={card.href}
                                            className={`group relative flex flex-col rounded-2xl border ${styles.border} p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl overflow-hidden ${
                                                isPlatinum ? 'bg-gradient-to-br from-slate-800 to-slate-900' :
                                                isPurple ? 'bg-gradient-to-br from-violet-950/60 to-slate-900' :
                                                'bg-white/5 backdrop-blur-sm hover:bg-white/10'
                                            }`}
                                        >
                                            {card.popular && (
                                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 whitespace-nowrap">
                                                    Mais popular
                                                </span>
                                            )}

                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${styles.badgeBg}`}>
                                                    <Icon className={`h-4 w-4 ${styles.iconColor}`} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-[0.18em] text-white">
                                                    {card.name}
                                                </span>
                                            </div>

                                            <p className={`text-2xl font-black tracking-tight ${styles.price}`}>{card.price}</p>
                                            <p className="text-[11px] text-slate-400 mb-3">{card.priceSuffix}</p>

                                            <ul className="space-y-1.5 flex-1 mb-4">
                                                {card.features.map(f => (
                                                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-snug">
                                                        <Check className="w-3 h-3 shrink-0 mt-0.5 text-teal-400" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>

                                            <span className="text-[11px] font-bold text-white/90 group-hover:text-white transition-colors">
                                                {card.cta} →
                                            </span>
                                        </Link>
                                    )
                                })}
                            </div>

                            <p className="text-center lg:text-left text-[11px] text-slate-500 pt-2">
                                Já tem conta? Entre à esquerda e gerencie seu plano em <span className="font-semibold text-slate-400">Perfil → Assinatura</span>.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function BackButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Voltar para escolher como entrar"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
            <ChevronLeft className="w-3 h-3" />
            Voltar
        </button>
    )
}
