'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Zap, Shield, Loader2, MapPin, Phone, Hash, Home, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const freeFeatures = [
  '10 consultas/mês',
  '1 template padrão',
  'Histórico de 30 dias',
]

const platinumFeatures = [
  '200 consultas/mês',
  'Templates ilimitados',
  'Histórico completo',
  'Exportação PDF',
  'Trilha do animal',
  'Busca com IA',
  'Anexos (fotos e exames)',
  'Suporte prioritário',
]

export default function AssinarPage() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [billingData, setBillingData] = useState({
    cpf: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    complemento: ''
  })

  const router = useRouter()
  const supabase = createClient()

  // Fetch current data on load
  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setBillingData({
            cpf: profile.cpf || '',
            telefone: profile.telefone || '',
            cep: profile.cep || '',
            endereco: profile.endereco || '',
            numero: profile.numero || '',
            bairro: profile.bairro || '',
            complemento: profile.complemento || ''
          })
        }
      }
    }
    checkProfile()
  }, [])

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    setBillingData(prev => ({ ...prev, cep }))

    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setBillingData(prev => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
          }))
          toast.success('Endereço preenchido automaticamente!')
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err)
      }
    }
  }

  async function startSubscription() {
    setLoading(true)
    
    // Validar se temos os dados básicos
    if (!billingData.cpf || !billingData.cep || !billingData.endereco || !billingData.numero) {
      setShowModal(true)
      setLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.')
        router.push('/login')
        return
      }

      const res = await fetch('/api/assinatura/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.erro?.includes('incompletos')) {
          setShowModal(true)
        } else {
          toast.error(data.erro ?? 'Erro ao gerar link de pagamento.')
        }
        return
      }

      window.location.href = data.paymentLink
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveAndSubscribe(e: React.FormEvent) {
    e.preventDefault()
    
    // Validação básica front-end
    const cleanCpf = billingData.cpf.replace(/\D/g, '')
    const cleanCep = billingData.cep.replace(/\D/g, '')

    if (cleanCpf.length !== 11) {
      toast.error('O CPF deve ter exatamente 11 dígitos.')
      return
    }

    if (cleanCep.length !== 8) {
      toast.error('O CEP deve ter exatamente 8 dígitos.')
      return
    }

    setUpdatingProfile(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update(billingData)
        .eq('id', user.id)

      if (error) throw error

      setShowModal(false)
      toast.success('Dados salvos! Gerando link...')
      
      // Delay pequeno para garantir que o Supabase atualizou (opcional, mas seguro)
      setTimeout(() => {
        startSubscription()
      }, 500)
    } catch (err) {
      toast.error('Erro ao salvar dados de faturamento.')
      console.error(err)
    } finally {
      setUpdatingProfile(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground">
            Comece grátis ou desbloqueie o poder total do ProntuVet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Free */}
          <div className="flex flex-col bg-card border border-border/60 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-teal-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-teal-600">Gratuito</span>
            </div>
            <p className="text-4xl font-black text-foreground mt-3 mb-1">R$0</p>
            <p className="text-sm text-muted-foreground mb-6">/mês · para sempre</p>

            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-teal-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => router.push('/dashboard')}
            >
              Continuar grátis
            </Button>
          </div>

          {/* Card Platinum */}
          <div className="flex flex-col relative bg-card border-2 border-green-500/60 rounded-3xl p-8 shadow-xl shadow-green-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full">
              Recomendado
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-green-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-green-600">Platinum</span>
            </div>
            <p className="text-4xl font-black text-foreground mt-3 mb-1">R$59,90</p>
            <p className="text-sm text-muted-foreground mb-6">/mês · 30 dias grátis</p>

            <ul className="space-y-3 mb-8 flex-1">
              {platinumFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={startSubscription}
              disabled={loading}
              className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-base shadow-lg shadow-green-600/25 transition-all hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aguarde...
                </>
              ) : (
                'Assinar agora'
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Pagamento seguro via Asaas · Cancele quando quiser
        </p>
      </div>

      {/* Billing Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Dados de Faturamento
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
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  required
                  value={billingData.cpf}
                  onChange={e => setBillingData(prev => ({ ...prev, cpf: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Telefone
                </Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  required
                  value={billingData.telefone}
                  onChange={e => setBillingData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> CEP
              </Label>
              <Input
                id="cep"
                placeholder="00000-000"
                required
                maxLength={8}
                value={billingData.cep}
                onChange={handleCepChange}
              />
            </div>

            <div className="grid grid-cols-[1fr_80px] gap-4">
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Home className="w-3 h-3" /> Endereço
                </Label>
                <Input
                  id="endereco"
                  placeholder="Av. Brasil"
                  required
                  value={billingData.endereco}
                  onChange={e => setBillingData(prev => ({ ...prev, endereco: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Nº
                </Label>
                <Input
                  id="numero"
                  placeholder="123"
                  required
                  value={billingData.numero}
                  onChange={e => setBillingData(prev => ({ ...prev, numero: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Map className="w-3 h-3" /> Bairro
              </Label>
              <Input
                id="bairro"
                placeholder="Centro"
                required
                value={billingData.bairro}
                onChange={e => setBillingData(prev => ({ ...prev, bairro: e.target.value }))}
              />
            </div>

            <div className="space-y-2 pb-2">
              <Label htmlFor="complemento" className="text-xs uppercase font-bold text-muted-foreground tracking-tight">
                Complemento (Opcional)
              </Label>
              <Input
                id="complemento"
                placeholder="Ex: Apto 101"
                value={billingData.complemento}
                onChange={e => setBillingData(prev => ({ ...prev, complemento: e.target.value }))}
              />
            </div>

            <Button
              type="submit"
              disabled={updatingProfile}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-11"
            >
              {updatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando dados...
                </>
              ) : (
                'Finalizar e Assinar'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
