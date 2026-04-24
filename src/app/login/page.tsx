"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SignupForm } from '@/components/auth/signup-form'
import { PRICING, formatPrice } from '@/lib/plan-pricing'
import { Shield, Star, Zap, Building2, Check } from 'lucide-react'

interface PlanCard {
    id: 'free' | 'essential' | 'platinum' | 'clinica'
    name: string
    price: string
    priceSuffix: string
    blurb: string
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
        blurb: '20 consultas/mês grátis',
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
        blurb: '80 consultas/mês',
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
        blurb: '200 consultas + ProntuLink',
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
        blurb: 'Multi-veterinário',
        features: ['600 consultas/mês', 'Múltiplos veterinários', 'Suporte via WhatsApp'],
        cta: 'Assinar Clínica',
        href: '/assinatura?plano=clinica&ciclo=monthly',
        icon: Building2,
        accent: 'purple',
    },
]

const ACCENT_STYLES: Record<PlanCard['accent'], { border: string; iconColor: string; badgeBg: string; price: string }> = {
    gray:     { border: 'border-white/10',                   iconColor: 'text-slate-300',  badgeBg: 'bg-white/5',                   price: 'text-white' },
    teal:     { border: 'border-teal-400/40',                iconColor: 'text-teal-300',   badgeBg: 'bg-teal-400/10',               price: 'text-white' },
    platinum: { border: 'border-slate-200/50',               iconColor: 'text-slate-200',  badgeBg: 'bg-gradient-to-br from-slate-200/20 to-slate-400/10', price: 'text-slate-100' },
    purple:   { border: 'border-violet-400/40',              iconColor: 'text-violet-300', badgeBg: 'bg-violet-400/10',             price: 'text-white' },
}

export default function LoginPage(props: { searchParams: { error?: string; redirect?: string; tab?: string } }) {
    const searchParams = props.searchParams
    const redirectTo = searchParams?.redirect && searchParams.redirect.startsWith('/') && !searchParams.redirect.startsWith('//')
        ? searchParams.redirect
        : undefined
    const defaultTab = searchParams?.tab === 'signup' ? 'signup' : 'login'

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-background overflow-x-hidden">
            {/* Esquerda — formulário */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in slide-in-from-left-8 duration-700 min-h-screen lg:min-h-0">
                <div className="w-full max-w-[420px] space-y-8">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start mb-4">
                            <Image src="/logo.png" alt="ProntuVet Logo" width={96} height={96} className="object-contain drop-shadow-sm" priority />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                            ProntuVet
                        </h1>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Bem-vindo de volta
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium">
                            O seu software veterinário inteligente
                        </p>
                    </div>

                    {searchParams?.error && (
                        <div className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-4 text-sm text-destructive font-semibold shadow-sm animate-in fade-in">
                            {searchParams.error}
                        </div>
                    )}

                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl mb-6">
                            <TabsTrigger value="login" className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                Entrar
                            </TabsTrigger>
                            <TabsTrigger value="signup" className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                Cadastro
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <form action={login}>
                                {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email-login" className="font-semibold">E-mail</Label>
                                        <Input
                                            id="email-login"
                                            name="email"
                                            type="email"
                                            placeholder="doutor(a)@clinica.com"
                                            required
                                            autoComplete="email"
                                            className="h-12 px-4 rounded-xl bg-background border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary shadow-sm transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password-login" className="font-semibold">Senha</Label>
                                            <a href="#" className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">Esqueceu a senha?</a>
                                        </div>
                                        <Input
                                            id="password-login"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            autoComplete="current-password"
                                            className="h-12 px-4 rounded-xl bg-background border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary shadow-sm transition-all"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.98]">
                                        Acessar o Sistema
                                    </Button>

                                    <div className="relative my-6 text-center">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-border/60"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-3 text-muted-foreground font-bold tracking-wider">Seguro & Criptografado</span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-card p-6 rounded-2xl border shadow-sm">
                                <SignupForm redirectTo={redirectTo} />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="text-center lg:text-left text-xs text-muted-foreground pt-2">
                        Dúvidas? Fale com a gente em{' '}
                        <a href="mailto:contato@prontuvet.com" className="font-semibold text-primary hover:underline">
                            contato@prontuvet.com
                        </a>
                    </div>

                    <div className="flex lg:hidden flex-col items-center justify-center pt-4 animate-bounce text-muted-foreground/60">
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Conheça os planos</span>
                        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/40 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Direita — resumo de planos */}
            <div className="flex flex-col w-full lg:w-1/2 relative bg-slate-950 overflow-hidden p-8 sm:p-12 lg:p-16 min-h-[700px] lg:min-h-screen">
                <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
                    <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-teal-500/10 blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px]" />
                </div>

                <div className="relative z-10 w-full max-w-xl mx-auto my-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
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
                </div>
            </div>
        </div>
    )
}
