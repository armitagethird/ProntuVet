"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, Mail, Shield, Plus, Key, Camera, PawPrint, Trash2, BarChart3, Clock, Zap, Dog, ArrowRight, Loader2, Download, FileWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { getPlanLimits } from '@/lib/plan-limits'
import { useRouter } from 'next/navigation'

export default function ClientProfile({ initialUser, plano, onLogout }: { initialUser: any, plano: string, onLogout: () => void }) {
    const supabase = createClient()
    const router = useRouter()
    const [userMeta, setUserMeta] = useState(initialUser.user_metadata || {})
    const [pets, setPets] = useState<{name: string, kind: string}[]>(initialUser.user_metadata?.my_pets || [])
    const [newPetName, setNewPetName] = useState('')
    const [newPetKind, setNewPetKind] = useState('')
    const [usage, setUsage] = useState({ daily: 0, monthly: 0, loading: true })
    const [deleting, setDeleting] = useState(false)

    const limits = getPlanLimits(plano)

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const today = new Date()
                today.setUTCHours(0, 0, 0, 0)
                
                const firstDayOfMonth = new Date()
                firstDayOfMonth.setUTCHours(0, 0, 0, 0)
                firstDayOfMonth.setUTCDate(1)

                // Fetch Daily
                const { count: dailyCount } = await supabase
                    .from('uso_consultas')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', initialUser.id)
                    .eq('sucesso', true)
                    .gte('data_consulta', today.toISOString())

                // Fetch Monthly
                const { count: monthlyCount } = await supabase
                    .from('uso_consultas')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', initialUser.id)
                    .eq('sucesso', true)
                    .gte('data_consulta', firstDayOfMonth.toISOString())

                setUsage({
                    daily: dailyCount || 0,
                    monthly: monthlyCount || 0,
                    loading: false
                })
            } catch (error) {
                console.error("Error fetching usage:", error)
                setUsage(prev => ({ ...prev, loading: false }))
            }
        }

        fetchUsage()
    }, [initialUser.id, supabase])

    const formatCPF = (cpf: string) => {
        if (!cpf) return 'Não informado'
        const digits = cpf.replace(/\D/g, '')
        if (digits.length !== 11) return cpf
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }

    const handlePasswordReset = async () => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(initialUser.email, {
                redirectTo: `${window.location.origin}/update-password`,
            })
            if (error) throw error
            toast.success('E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao redefinir senha.')
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return
            const file = e.target.files[0]
            
            // Validação de segurança: Tamanho e Tipo
            if (!file.type.startsWith('image/')) {
                return toast.error('Por favor, selecione um arquivo de imagem válido.')
            }

            const maxSize = 5 * 1024 * 1024 // 5MB
            if (file.size > maxSize) {
                return toast.error('A foto de perfil deve ter no máximo 5MB.')
            }

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${initialUser.id}/${fileName}`

            toast.loading('Fazendo upload...', { id: 'upload' })
            
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
            
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            })

            if (updateError) throw updateError

            setUserMeta({ ...userMeta, avatar_url: publicUrl })
            toast.success('Foto de perfil atualizada!', { id: 'upload' })
        } catch (error: any) {
            toast.error(error.message || 'Erro ao enviar foto. Verifique se executou o script SQL de Storage.', { id: 'upload' })
        }
    }

    const handleAddPet = async () => {
        if (!newPetName || !newPetKind) return toast.error('Preencha os dados do pet.')
        
        const updatedPets = [...pets, { name: newPetName, kind: newPetKind }]
        setPets(updatedPets)
        setNewPetName('')
        setNewPetKind('')

        const { error } = await supabase.auth.updateUser({
            data: { my_pets: updatedPets }
        })

        if (error) toast.error('Erro ao salvar pet.')
        else toast.success('Membro fofo adicionado com sucesso!')
    }

    const handleRemovePet = async (index: number) => {
        const updatedPets = pets.filter((_, i) => i !== index)
        setPets(updatedPets)

        await supabase.auth.updateUser({
            data: { my_pets: updatedPets }
        })
    }

    const handleExportData = async () => {
        const id = toast.loading('Preparando exportação...')
        try {
            const res = await fetch('/api/lgpd/export')
            if (!res.ok) throw new Error('Falha ao exportar')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `prontuvet-dados-${new Date().toISOString().slice(0, 10)}.json`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success('Download iniciado.', { id })
        } catch (err: any) {
            toast.error(err.message || 'Erro ao exportar dados.', { id })
        }
    }

    const handleDeleteAccount = async () => {
        const confirmation = window.prompt(
            'Esta ação é IRREVERSÍVEL. Todos os seus prontuários, animais, transcrições e anexos serão apagados.\n\nDigite EXCLUIR para confirmar:'
        )
        if (confirmation !== 'EXCLUIR') {
            toast.info('Exclusão cancelada.')
            return
        }
        setDeleting(true)
        const id = toast.loading('Excluindo conta...')
        try {
            const res = await fetch('/api/lgpd/delete-account', { method: 'DELETE' })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'Erro ao excluir conta')
            toast.success('Conta excluída.', { id })
            setTimeout(() => router.push('/login'), 1000)
        } catch (err: any) {
            toast.error(err.message || 'Erro ao excluir conta.', { id })
            setDeleting(false)
        }
    }

    const handleCancelSubscription = async () => {
        const id = toast.loading('Processando cancelamento...')
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Não autenticado')

            const res = await fetch('/api/assinatura/cancelar', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.erro || 'Erro ao cancelar')

            toast.success('Assinatura cancelada com sucesso.', { id })
            
            // Recarrega a página para atualizar o status do plano vindo do servidor/URL
            setTimeout(() => {
                window.location.reload()
            }, 1500)
            
        } catch (error: any) {
            toast.error(error.message || 'Erro ao cancelar assinatura.', { id })
        }
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-start max-w-4xl mx-auto w-full pt-8 pb-32 space-y-8 px-4 animate-fade-in-up">
            
            <div className="w-full flex flex-col md:flex-row gap-6 items-center bg-card/60 border border-border/50 rounded-3xl p-8 backdrop-blur-xl shadow-lg">
                <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-500/10 border-4 border-background shadow-xl flex items-center justify-center ring-2 ring-purple-500/20">
                        {userMeta.avatar_url ? (
                            <Image src={userMeta.avatar_url} alt="Avatar" width={96} height={96} className="object-cover w-full h-full" />
                        ) : (
                            <User className="w-10 h-10 text-purple-500" />
                        )}
                    </div>
                    <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                        <Camera className="w-4 h-4" />
                    </Label>
                    <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={false} />
                </div>
                
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {userMeta.first_name || 'Doutor(a)'} {userMeta.last_name || ''}
                    </h1>
                    <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                        <Mail className="w-4 h-4" /> {initialUser.email}
                    </p>
                </div>

                <form action={onLogout}>
                    <Button type="submit" variant="destructive" className="w-full sm:w-auto px-6 rounded-full shadow-lg font-semibold hover:scale-105 transition-transform">
                        <LogOut className="w-4 h-4 mr-2" /> Sair
                    </Button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                
                {/* ACCOUNT INFO CARD */}
                <div className="space-y-6 bg-card/40 border border-border/40 rounded-3xl p-6 backdrop-blur-md">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-teal-500" /> Informações
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input disabled value={`${userMeta.first_name || ''} ${userMeta.last_name || ''}`} className="bg-muted/50 text-muted-foreground opacity-80" />
                            <p className="text-xs text-muted-foreground px-1">Seu nome não pode ser alterado por aqui.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>CPF</Label>
                            <div className="relative group/cpf">
                                <Input 
                                    disabled 
                                    value={formatCPF(userMeta.cpf)} 
                                    className="bg-muted/50 text-muted-foreground opacity-80 font-mono tracking-wider" 
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/cpf:opacity-100 transition-opacity">
                                    <Shield className="w-4 h-4 text-teal-500/50" />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground px-1">O CPF é usado para validação da conta e anti-fraude.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input disabled value={initialUser.email || ''} className="bg-muted/50 text-muted-foreground opacity-80" />
                            <p className="text-xs text-muted-foreground px-1">O E-mail associado à conta não pode ser mudado.</p>
                        </div>
                    </div>
                </div>

                {/* SECURITY CARD */}
                <div className="space-y-6 bg-card/40 border border-border/40 rounded-3xl p-6 backdrop-blur-md">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Key className="w-5 h-5 text-purple-500" /> Segurança
                    </h2>
                    
                    <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl">
                        <p className="text-sm text-foreground mb-4 font-medium">Esqueceu ou deseja alterar a sua senha?</p>
                        <Button variant="outline" onClick={handlePasswordReset} className="w-full rounded-xl hover:bg-purple-500/10 hover:text-purple-600 transition-colors">
                            Enviar e-mail para Redefinição
                        </Button>
                    </div>
                </div>


                {/* MY PETS (FUN) */}
                <div className="md:col-span-2 space-y-6 bg-card/40 border border-border/40 rounded-3xl p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <PawPrint className="w-5 h-5 text-orange-500" /> Meus Pets
                        </h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-orange-500/10 text-orange-600 rounded-full">Para Diversão</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1 w-full">
                            <Label>Nome</Label>
                            <Input placeholder="Ex: Rex" value={newPetName} onChange={(e) => setNewPetName(e.target.value)} className="bg-background rounded-xl" />
                        </div>
                        <div className="space-y-2 flex-1 w-full">
                            <Label>Espécie / Raça</Label>
                            <Input placeholder="Ex: Golden Retriever" value={newPetKind} onChange={(e) => setNewPetKind(e.target.value)} className="bg-background rounded-xl" />
                        </div>
                        <Button onClick={handleAddPet} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl w-full sm:w-auto mt-4 sm:mt-0 px-6">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                        {pets.map((pet, idx) => (
                            <div key={idx} className="relative flex items-center justify-between p-4 bg-background border border-border/60 rounded-2xl shadow-sm hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-full">
                                        <PawPrint className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground capitalize">{pet.name}</p>
                                        <p className="text-xs text-muted-foreground">{pet.kind}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemovePet(idx)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full h-8 w-8">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {pets.length === 0 && (
                            <div className="col-span-full p-8 text-center border-2 border-dashed border-border/50 text-muted-foreground rounded-2xl bg-muted/10">
                                Você ainda não tem nenhum pet registrado!
                            </div>
                        )}
                    </div>
                </div>

                {/* USAGE DASHBOARD */}
                <div className="md:col-span-2 space-y-6 bg-card/60 border-2 border-teal-500/10 rounded-3xl p-8 backdrop-blur-xl shadow-xl bg-gradient-to-br from-teal-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-teal-500" /> Uso do Plano de IA
                        </h2>
                        {plano === 'platinum' ? (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-slate-200 via-white to-slate-200 text-slate-700 rounded-full text-sm font-black border border-slate-300/50 shadow-sm shadow-slate-400/10 uppercase tracking-widest">
                                <Zap className="w-4 h-4 fill-current text-slate-400" /> Plano Platinum
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-teal-500/10 to-teal-500/5 text-teal-600 rounded-full text-sm font-black border border-teal-500/20 shadow-sm uppercase tracking-widest">
                                <Shield className="w-4 h-4 fill-current text-teal-500/50" /> Plano Free
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                        <div className="space-y-4 p-6 bg-background/40 border border-border/40 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-500" />
                                    <span className="font-semibold">Limite Diário</span>
                                </div>
                                <span className="text-sm font-bold">{usage.daily} / {limits.daily}</span>
                            </div>
                            <Progress value={Math.min((usage.daily / limits.daily) * 100, 100)} className="h-3 bg-muted/50" color="purple" />
                            <p className="text-xs text-muted-foreground">O limite diário é resetado à meia-noite (UTC-3) para proteção da conta.</p>
                        </div>

                        <div className="space-y-4 p-6 bg-background/40 border border-border/40 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-teal-500" />
                                    <span className="font-semibold">Limite Mensal</span>
                                </div>
                                <span className="text-sm font-bold">{usage.monthly} / {limits.monthly}</span>
                            </div>
                            <Progress value={Math.min((usage.monthly / limits.monthly) * 100, 100)} className="h-3 bg-muted/50" />
                            <p className="text-xs text-muted-foreground">O uso de IA é contabilizado em até 10 minutos por consulta.</p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-teal-500/5 border border-teal-500/20 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                        <p className="text-sm text-foreground/80">
                            <strong>Dica Profissional:</strong> Você economizou aproximadamente <strong>{Math.round(usage.monthly * 12)} minutos</strong> de digitação este mês com o ProntuVet.
                        </p>
                    </div>

                    {/* Botão de Cancelamento para Platinum */}
                    {plano === 'platinum' && (
                      <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground">Gerenciar Assinatura</p>
                          <p className="text-xs text-muted-foreground">O cancelamento é imediato e interrompe a renovação automática.</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/5 text-xs font-semibold"
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja cancelar sua assinatura Platinum? Você perderá o acesso ilimitado imediatamente.')) {
                              handleCancelSubscription();
                            }
                          }}
                          disabled={usage.loading}
                        >
                          Cancelar Assinatura
                        </Button>
                      </div>
                    )}
                </div>

                {/* CLÍNICA (multi-tenant) — apenas plano Clínica */}
                {plano === 'clinica' && (
                    <div className="md:col-span-2 bg-card/40 border border-border/40 rounded-3xl p-6 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                <PawPrint className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Minha Clínica</h2>
                                <p className="text-sm text-muted-foreground">Crie uma clínica para compartilhar o plano com a equipe.</p>
                            </div>
                        </div>
                        <Link href="/clinica">
                            <Button variant="outline" className="rounded-xl hover:bg-purple-500/10 hover:text-purple-600">
                                Gerenciar clínica
                            </Button>
                        </Link>
                    </div>
                )}

                {/* LGPD / PRIVACIDADE */}
                <div className="md:col-span-2 space-y-4 bg-card/40 border border-border/40 rounded-3xl p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-teal-500" /> Privacidade e Dados (LGPD)
                        </h2>
                        <div className="flex gap-3 text-xs">
                            <Link href="/termos" target="_blank" className="text-teal-600 hover:underline font-semibold">Termos</Link>
                            <Link href="/privacidade" target="_blank" className="text-teal-600 hover:underline font-semibold">Privacidade</Link>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Exerça seus direitos de acesso, portabilidade e eliminação (Art. 18 da LGPD). Os dados exportados incluem prontuários, animais, perfil e histórico de uso.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExportData}
                            className="flex-1 rounded-xl hover:bg-teal-500/10 hover:text-teal-600"
                        >
                            <Download className="w-4 h-4 mr-2" /> Exportar meus dados
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="flex-1 rounded-xl text-red-600 border-red-500/30 hover:bg-red-500/10 hover:text-red-700"
                        >
                            {deleting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</>
                            ) : (
                                <><FileWarning className="w-4 h-4 mr-2" /> Excluir minha conta</>
                            )}
                        </Button>
                    </div>
                </div>

                {/* UPGRADE CARD */}
                {plano === 'free' && (
                  <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-200 via-white to-slate-200 rounded-[2.5rem] p-8 text-slate-900 border border-slate-300/50 shadow-2xl shadow-slate-400/20 group animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Zap className="w-32 h-32 text-slate-400 fill-current" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                           Oferta Premium
                        </div>
                        <h3 className="text-3xl font-black tracking-tight text-slate-900">Elevando sua Prática</h3>
                        <p className="text-slate-600 max-w-md font-medium">
                          O selo <strong>Platinum</strong> garante 200 consultas/mês, modelos ilimitados e o poder máximo da IA veterinária.
                        </p>
                      </div>
                      
                      <Link href="/assinatura" className="w-full md:w-auto">
                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold px-8 py-7 rounded-2xl shadow-xl shadow-slate-900/20 transition-all hover:scale-105 group/btn">
                          Assinar Platinum Agora
                          <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>

                    {/* Subtle metallic shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  </div>
                )}

            </div>

        </div>
    )
}
