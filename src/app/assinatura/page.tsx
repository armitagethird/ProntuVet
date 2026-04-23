'use client'

import { useState, useEffect, useMemo, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Zap, Shield, Loader2, MapPin, Phone, Hash, Home, Map, Star, Building2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const WHATSAPP_CLINICA = 'https://wa.me/5511999999999?text=Ol%C3%A1%2C+tenho+interesse+no+Plano+Cl%C3%ADnica+do+ProntuVet'

// ── Gradientes Platinum ──────────────────────────────────────────────────────
const PLAT_GRAD = 'linear-gradient(135deg,#475569 0%,#94a3b8 22%,#e2e8f0 42%,#f8fafc 50%,#e2e8f0 58%,#94a3b8 78%,#475569 100%)'
const platShimmer: CSSProperties = { background: PLAT_GRAD, backgroundSize: '200% 100%', animation: 'shimmer 3.2s linear infinite' }
const platText: CSSProperties = { ...platShimmer, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }

// ── Gradientes Clínica ───────────────────────────────────────────────────────
const CLINIC_BORDER = 'linear-gradient(135deg,#7c3aed,#4c1d95,#6d28d9,#a78bfa,#7c3aed)'
const clinicText: CSSProperties = { background: 'linear-gradient(135deg,#a78bfa,#c4b5fd,#ede9fe)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }

// ── Preços ───────────────────────────────────────────────────────────────────
const PRICING = {
  essential: { monthly: 34.90, annual: 27.90 },
  platinum:  { monthly: 69.90, annual: 55.90 },
  clinica:   { monthly: 149.90, annual: 119.90 },
} as const

// ── Tabela de comparação ─────────────────────────────────────────────────────
type PlanKey = 'free' | 'essential' | 'platinum' | 'clinica'
interface CompRow { label: string; free: boolean | string; essential: boolean | string; platinum: boolean | string; clinica: boolean | string }

const COMPARISON: CompRow[] = [
  { label: 'Consultas por mês',   free: '20',         essential: '80',          platinum: '200',          clinica: '600' },
  { label: 'Consultas por dia',   free: '15',         essential: '20',          platinum: '20',           clinica: '60' },
  { label: 'Templates próprios',  free: '1',          essential: 'Ilimitados',  platinum: 'Ilimitados',   clinica: 'Ilimitados' },
  { label: 'Timeline clínica',    free: false,        essential: true,          platinum: true,           clinica: true },
  { label: 'ProntuLink',          free: false,        essential: false,         platinum: true,           clinica: true },
  { label: 'Múltiplos vets',      free: false,        essential: false,         platinum: false,          clinica: true },
  { label: 'Armazenamento',       free: '—',          essential: '25 MB',       platinum: '200 MB',       clinica: 'Ilimitado' },
  { label: 'Suporte',             free: '—',          essential: 'Email',       platinum: 'Prioritário',  clinica: 'WhatsApp direto' },
]

// ── Social proof ─────────────────────────────────────────────────────────────
const PROOF = [
  { value: '4.200+', label: 'prontuários esta semana' },
  { value: '98%',    label: 'satisfação dos vets' },
  { value: '3 min',  label: 'por consulta em média' },
]


const CARD_DELAY = [0, 80, 160, 240] as const

type PaidPlan = 'essential' | 'platinum' | 'clinica'

export default function AssinarPage() {
  const [visible, setVisible]           = useState(false)
  const [billing, setBilling]           = useState<'monthly' | 'annual'>('monthly')
  const [loadingPlan, setLoadingPlan]   = useState<PaidPlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [showTable, setShowTable]       = useState(false)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [billingData, setBillingData]   = useState({
    cpf: '', telefone: '', cep: '', endereco: '', numero: '', bairro: '', complemento: '',
  })
  const router   = useRouter()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) setBillingData({ cpf: profile.cpf || '', telefone: profile.telefone || '', cep: profile.cep || '', endereco: profile.endereco || '', numero: profile.numero || '', bairro: profile.bairro || '', complemento: profile.complemento || '' })
    }
    loadProfile()
  }, [])

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    setBillingData(prev => ({ ...prev, cep }))
    if (cep.length === 8) {
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) { setBillingData(prev => ({ ...prev, endereco: data.logradouro, bairro: data.bairro })); toast.success('Endereço preenchido!') }
      } catch { /* silent */ }
    }
  }

  async function startSubscription(plan: PaidPlan) {
    setLoadingPlan(plan); setSelectedPlan(plan)
    if (!billingData.cpf || !billingData.cep || !billingData.endereco || !billingData.numero) { setShowModal(true); setLoadingPlan(null); return }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Sessão expirada. Faça login novamente.'); router.push('/login'); return }
      const res  = await fetch('/api/assinatura/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plano: plan, ciclo: billing }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.erro?.includes('incompletos')) {
          setShowModal(true)
        } else if (data.erro?.includes('Crie uma clínica')) {
          toast.info('Crie sua clínica primeiro para assinar o plano Clínica.')
          router.push('/clinica')
        } else {
          toast.error(data.erro ?? 'Erro ao gerar link.')
        }
        return
      }
      window.location.href = data.paymentLink
    } catch { toast.error('Erro inesperado. Tente novamente.') }
    finally { setLoadingPlan(null) }
  }

  async function handleSaveAndSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (billingData.cpf.replace(/\D/g, '').length !== 11) { toast.error('CPF deve ter 11 dígitos.'); return }
    if (billingData.cep.replace(/\D/g, '').length !== 8)  { toast.error('CEP deve ter 8 dígitos.'); return }
    setUpdatingProfile(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('profiles').update(billingData).eq('id', user.id)
      if (error) throw error
      setShowModal(false); toast.success('Dados salvos! Gerando link...')
      setTimeout(() => { if (selectedPlan) startSubscription(selectedPlan) }, 500)
    } catch { toast.error('Erro ao salvar dados de faturamento.') }
    finally { setUpdatingProfile(false) }
  }

  const fmt  = (v: number) => v.toFixed(2).replace('.', ',')
  const px   = (p: keyof typeof PRICING) => billing === 'annual' ? PRICING[p].annual : PRICING[p].monthly
  const disc = (p: keyof typeof PRICING) => Math.round((1 - PRICING[p].annual / PRICING[p].monthly) * 100)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background overflow-auto relative">

      {/* ── Aurora Background ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55%', height: '55%', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(20,184,166,0.09) 0%, transparent 70%)',
          animation: 'aurora-drift-a 14s ease-in-out infinite', willChange: 'transform' }} />
        <div style={{ position: 'absolute', top: '5%', right: '-12%', width: '50%', height: '50%', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)',
          animation: 'aurora-drift-b 17s ease-in-out infinite', willChange: 'transform' }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '25%', width: '50%', height: '40%', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)',
          animation: 'aurora-drift-c 20s ease-in-out infinite', willChange: 'transform' }} />
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative text-center mb-8 flex flex-col items-center transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-500 mb-2">Planos ProntuVet</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3">Escolha seu plano</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Comece grátis ou desbloqueie o poder total do ProntuVet
        </p>

        {/* ── Billing Toggle ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 backdrop-blur-sm border border-border/50 rounded-full p-1.5 shadow-sm">
            {/* Mensal */}
            <button onClick={() => setBilling('monthly')}
              className="relative flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-300"
              style={{
                background: billing === 'monthly' ? 'var(--card)' : 'transparent',
                color: billing === 'monthly' ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: billing === 'monthly' ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
              }}>
              Mensal
            </button>

            {/* Anual — destaque teal */}
            <button onClick={() => setBilling('annual')}
              className="relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black transition-all duration-300"
              style={billing === 'annual' ? {
                background: 'linear-gradient(135deg,#0d9488,#0f766e)',
                color: 'white',
                boxShadow: '0 4px 18px -4px rgba(13,148,136,0.55)',
              } : {
                background: 'rgba(20,184,166,0.10)',
                color: '#0d9488',
                animation: 'annual-pulse 2.2s ease-in-out infinite',
                border: '1px solid rgba(20,184,166,0.35)',
              }}>
              Anual
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                style={billing === 'annual'
                  ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                  : { background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: 'white' }}>
                −20%
              </span>
            </button>
          </div>
          {billing === 'monthly' && (
            <p className="text-[11px] font-semibold text-teal-600 animate-pulse">
              Economize até R$ 167/ano no Platinum ↑
            </p>
          )}
        </div>
      </div>

      {/* ── Social Proof Strip ────────────────────────────────────────────── */}
      <div className="relative w-full max-w-lg mb-10 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transitionDelay: '80ms' }}>
        <div className="flex items-center justify-around py-4 px-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm">
          {PROOF.map((item, i) => (
            <div key={i} className="text-center px-3">
              <p className="text-xl font-black text-foreground tracking-tight">{item.value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cards Grid ────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-center">

        {/* FREE */}
        <div className="relative flex flex-col rounded-[2rem] border border-border/60 bg-card p-7 shadow-sm h-full transition-all duration-700 hover:shadow-md hover:-translate-y-0.5 order-4 xl:order-1"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${CARD_DELAY[0]}ms` }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Gratuito</span>
          </div>
          <p className="text-4xl font-black text-foreground mt-3 mb-0.5">R$ 0</p>
          <p className="text-sm text-muted-foreground mb-6">para sempre</p>
          <ul className="space-y-2.5 flex-1">
            {['20 consultas por mês', '15 por dia', 'Prontuário Padrão', '1 template próprio', 'Resumo para o tutor'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />{f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full rounded-2xl mt-auto" onClick={() => router.push('/dashboard')}>
            Começar grátis
          </Button>
        </div>

        {/* ESSENTIAL */}
        <div className="relative flex flex-col rounded-[2rem] bg-card p-7 h-full transition-all duration-700 hover:-translate-y-1 order-2 xl:order-2"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${CARD_DELAY[1]}ms`, border: '1px solid rgba(20,184,166,0.35)' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 28px 2px rgba(20,184,166,0.13)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
          <div className="absolute inset-0 rounded-[2rem] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(20,184,166,0.06) 0%, transparent 60%)' }} />
          <div className="relative flex flex-col flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-teal-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">Essential</span>
              </div>
              {billing === 'annual' && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(20,184,166,0.12)', color: '#0d9488' }}>
                  Economize {disc('essential')}%
                </span>
              )}
            </div>
            <p className="text-4xl font-black text-foreground mt-3 mb-0.5">R$ {fmt(px('essential'))}</p>
            <p className="text-sm text-muted-foreground">{billing === 'annual' ? '/ mês · cobrado anualmente' : '/ mês'}</p>
            {billing === 'annual'
              ? <p className="text-xs text-teal-600 font-semibold mb-5 mt-0.5">Era R$ {fmt(PRICING.essential.monthly)}/mês</p>
              : <div className="mb-6 mt-0.5" />}
            <ul className="space-y-2.5 flex-1">
              {['80 consultas por mês', '20 por dia', 'Templates ilimitados', 'Timeline clínica', 'Resumo para o tutor', 'Anexos até 25 MB'].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />{f}
                </li>
              ))}
            </ul>
            <button onClick={() => startSubscription('essential')} disabled={loadingPlan !== null}
              className="mt-auto w-full h-11 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', boxShadow: '0 4px 18px -4px rgba(13,148,136,0.4)' }}>
              {loadingPlan === 'essential'
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Aguarde...</span>
                : 'Assinar Essential'}
            </button>
          </div>
        </div>

        {/* PLATINUM */}
        <div className="relative flex flex-col rounded-[2rem] h-full transition-[opacity,transform] duration-700 xl:-mt-4 order-1 xl:order-3"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${CARD_DELAY[2]}ms`, animation: visible ? 'glow-pulse-plat 3.5s ease-in-out infinite' : 'none' }}>
          <div className="absolute -inset-[1.5px] rounded-[2rem]" style={{ ...platShimmer, opacity: 0.9 }} />
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
            style={{ ...platShimmer, color: '#0c1420' }}>Mais popular</div>
          <div className="relative rounded-[calc(2rem-1.5px)] overflow-hidden flex flex-col flex-1 h-full" style={{ background: '#0c1420' }}>
            {/* Glow superior */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 90% 32% at 50% 0%, rgba(226,232,240,0.10) 0%, transparent 65%)' }} />

            {/* Shine corner-to-corner */}
            <div aria-hidden className="absolute inset-y-0 pointer-events-none"
              style={{
                left: 0,
                width: '55%',
                background: 'linear-gradient(105deg, transparent 25%, rgba(248,250,252,0.07) 43%, rgba(248,250,252,0.22) 50%, rgba(248,250,252,0.07) 57%, transparent 75%)',
                animation: 'plat-shine 5s ease-in-out 1s infinite',
                willChange: 'transform',
              }} />

            <div className="relative p-7 flex flex-col gap-4 flex-1">
              {/* Header */}
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4" style={{ color: '#94a3b8' }} />
                <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={platText}>Platinum</span>
                {billing === 'annual' && (
                  <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}>
                    Economize {disc('platinum')}%
                  </span>
                )}
              </div>

              {/* Price */}
              <div>
                <p className="text-5xl font-black tracking-tighter" style={platText}>R$ {fmt(px('platinum'))}</p>
                <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{billing === 'annual' ? '/ mês · cobrado anualmente' : '/ mês'}</p>
                {billing === 'annual'
                  ? <p className="text-xs font-semibold mt-0.5" style={{ color: '#94a3b8' }}>Era R$ {fmt(PRICING.platinum.monthly)}/mês</p>
                  : <p className="text-xs font-semibold mt-0.5" style={{ color: '#94a3b8' }}>8 em 10 veterinários escolhem</p>}
              </div>

              <div className="h-px" style={{ background: 'linear-gradient(to right, rgba(148,163,184,0.35), transparent)' }} />

              {/* Social proof — pulsing dot (igual ao site) */}
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Plano mais escolhido</span>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {['200 consultas por mês', '20 por dia', 'Templates ilimitados', 'Timeline clínica completa', 'ProntuLink — link do prontuário', 'Anexos PDF e imagens até 200 MB', 'Suporte prioritário'].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#cbd5e1' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg,#475569,#94a3b8)' }}>
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>{f}
                  </li>
                ))}
              </ul>

              <button onClick={() => startSubscription('platinum')} disabled={loadingPlan !== null}
                className="mt-auto w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                style={{ ...platShimmer, color: '#0c1420' }}>
                {loadingPlan === 'platinum'
                  ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Aguarde...</span>
                  : 'Assinar Platinum'}
              </button>
            </div>
          </div>
        </div>

        {/* CLÍNICA */}
        <div className="relative flex flex-col rounded-[2rem] h-full transition-[opacity,transform] duration-700 order-3 xl:order-4"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${CARD_DELAY[3]}ms`, animation: visible ? 'glow-pulse-clinic 3.5s ease-in-out infinite' : 'none' }}>
          <div className="absolute -inset-[1px] rounded-[2rem]" style={{ background: CLINIC_BORDER, opacity: 0.65 }} />
          <div className="relative rounded-[calc(2rem-1px)] overflow-hidden flex flex-col flex-1 h-full" style={{ background: '#0d0520' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(139,92,246,0.22) 0%, transparent 60%)' }} />
            <div className="relative p-7 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: '#a78bfa' }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={clinicText}>Clínica</span>
                </div>
                {billing === 'annual' && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                    Economize {disc('clinica')}%
                  </span>
                )}
              </div>
              <p className="text-4xl font-black tracking-tighter mt-3 mb-0.5" style={clinicText}>R$ {fmt(px('clinica'))}</p>
              <p className="text-sm" style={{ color: '#6d28d9' }}>{billing === 'annual' ? '/ mês · cobrado anualmente' : '/ mês'}</p>
              {billing === 'annual'
                ? <p className="text-xs font-semibold mt-0.5 mb-5" style={{ color: '#a78bfa' }}>Era R$ {fmt(PRICING.clinica.monthly)}/mês</p>
                : <div className="mb-6 mt-0.5" />}
              <ul className="space-y-2.5 flex-1">
                {['600 consultas por mês', 'Múltiplos veterinários', 'Tudo do Platinum', 'ProntuLink avançado', 'Gestão de equipe', 'Suporte via WhatsApp direto'].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#c4b5fd' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>{f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <button
                  onClick={() => startSubscription('clinica')}
                  disabled={loadingPlan !== null}
                  className="w-full h-11 rounded-2xl font-bold text-sm flex items-center justify-center transition-all disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', color: 'white', boxShadow: '0 4px 18px -4px rgba(124,58,237,0.45)' }}>
                  {loadingPlan === 'clinica'
                    ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Aguarde...</span>
                    : 'Assinar Clínica'}
                </button>
                <a href={WHATSAPP_CLINICA} target="_blank" rel="noopener noreferrer"
                  className="w-full h-9 rounded-xl font-semibold text-xs flex items-center justify-center transition-all"
                  style={{ border: '1px solid rgba(139,92,246,0.45)', color: '#a78bfa', background: 'rgba(139,92,246,0.07)' }}>
                  Falar com a equipe
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Comparison Table ──────────────────────────────────────────────── */}
      <div className="relative w-full max-w-5xl mt-10 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transitionDelay: '320ms' }}>
        <button onClick={() => setShowTable(v => !v)}
          className="mx-auto flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-1">
          <span>{showTable ? 'Ocultar' : 'Ver'} comparação detalhada</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showTable ? 'rotate-180' : ''}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-500 ${showTable ? 'max-h-[700px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="overflow-x-auto rounded-[1.5rem] border border-border/50 bg-card/60 backdrop-blur-sm">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 font-semibold text-muted-foreground w-[34%]">Recurso</th>
                  <th className="text-center p-4 font-bold text-foreground">Free</th>
                  <th className="text-center p-4 font-bold text-teal-600">Essential</th>
                  <th className="text-center p-4 font-black" style={platText}>Platinum</th>
                  <th className="text-center p-4 font-black" style={clinicText}>Clínica</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 last:border-0 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                    <td className="p-4 font-medium text-foreground/80">{row.label}</td>
                    {(['free', 'essential', 'platinum', 'clinica'] as PlanKey[]).map(plan => {
                      const val = row[plan]
                      return (
                        <td key={plan} className="p-4 text-center">
                          {typeof val === 'boolean'
                            ? val
                              ? <Check className="w-4 h-4 text-teal-500 mx-auto" />
                              : <span className="text-muted-foreground/30 text-base">—</span>
                            : <span className="text-muted-foreground text-xs">{val}</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="relative text-center text-xs text-muted-foreground mt-8 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transitionDelay: '400ms' }}>
        Pagamento seguro via Asaas · Cancele quando quiser · Acesso web e mobile em todos os planos
      </p>

      {/* ── Billing Modal ─────────────────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" /> Dados de Faturamento
            </DialogTitle>
            <DialogDescription>
              O Asaas exige seus dados para processar a assinatura recorrente com segurança.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAndSubscribe} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" /> CPF
                </Label>
                <Input id="cpf" placeholder="000.000.000-00" required value={billingData.cpf}
                  onChange={e => setBillingData(p => ({ ...p, cpf: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Telefone
                </Label>
                <Input id="telefone" placeholder="(00) 00000-0000" required value={billingData.telefone}
                  onChange={e => setBillingData(p => ({ ...p, telefone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> CEP
              </Label>
              <Input id="cep" placeholder="00000-000" required maxLength={8} value={billingData.cep} onChange={handleCepChange} />
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-4">
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Home className="w-3 h-3" /> Endereço
                </Label>
                <Input id="endereco" placeholder="Av. Brasil" required value={billingData.endereco}
                  onChange={e => setBillingData(p => ({ ...p, endereco: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Nº
                </Label>
                <Input id="numero" placeholder="123" required value={billingData.numero}
                  onChange={e => setBillingData(p => ({ ...p, numero: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Map className="w-3 h-3" /> Bairro
              </Label>
              <Input id="bairro" placeholder="Centro" required value={billingData.bairro}
                onChange={e => setBillingData(p => ({ ...p, bairro: e.target.value }))} />
            </div>
            <div className="space-y-2 pb-2">
              <Label htmlFor="complemento" className="text-xs uppercase font-bold text-muted-foreground">
                Complemento (Opcional)
              </Label>
              <Input id="complemento" placeholder="Ex: Apto 101" value={billingData.complemento}
                onChange={e => setBillingData(p => ({ ...p, complemento: e.target.value }))} />
            </div>
            <Button type="submit" disabled={updatingProfile} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-11">
              {updatingProfile
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                : 'Finalizar e Assinar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
