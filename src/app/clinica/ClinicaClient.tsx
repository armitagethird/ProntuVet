'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Building2, UserPlus, Copy, Trash2, Crown, ShieldCheck, Stethoscope, Loader2, Mail, LogOut } from 'lucide-react'

type Role = 'owner' | 'admin' | 'vet'

interface Org {
    id: string
    nome: string
    plano: string
    status: string
    data_vencimento: string | null
    created_at: string
}

interface Member {
    user_id: string
    role: Role
    joined_at: string
    name: string
    email: string | null
}

interface Invite {
    id: string
    email: string
    role: 'admin' | 'vet'
    expires_at: string
    created_at: string
}

interface ClinicaData {
    organization: Org | null
    members: Member[]
    invites: Invite[]
    currentUserRole: Role | null
}

export default function ClinicaClient({
    initialHasOrg,
    initialRole,
    currentUserId,
}: {
    initialHasOrg: boolean
    initialRole: Role | null
    currentUserId: string
}) {
    const [data, setData] = useState<ClinicaData | null>(null)
    const [loading, setLoading] = useState(initialHasOrg)
    const [creating, setCreating] = useState(false)
    const [inviting, setInviting] = useState(false)
    const [newOrgName, setNewOrgName] = useState('')
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<'admin' | 'vet'>('vet')
    const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/clinica', { cache: 'no-store' })
            if (res.ok) setData(await res.json())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (initialHasOrg) loadData()
    }, [initialHasOrg])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newOrgName.trim()) return
        setCreating(true)
        const id = toast.loading('Criando clínica...')
        try {
            const res = await fetch('/api/clinica', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: newOrgName.trim() }),
            })
            const payload = await res.json()
            if (!res.ok) throw new Error(payload.error || 'Erro')
            toast.success('Clínica criada.', { id })
            await loadData()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao criar clínica.', { id })
        } finally {
            setCreating(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail.trim()) return
        setInviting(true)
        const id = toast.loading('Gerando convite...')
        try {
            const res = await fetch('/api/clinica/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
            })
            const payload = await res.json()
            if (!res.ok) throw new Error(payload.error || 'Erro')
            toast.success('Convite gerado. Envie o link para o colega.', { id })
            setLastInviteUrl(payload.inviteUrl)
            setInviteEmail('')
            await loadData()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao convidar.', { id })
        } finally {
            setInviting(false)
        }
    }

    const handleCopyInvite = async (token?: string) => {
        const url = token ? `${window.location.origin}/clinica/aceitar/${token}` : lastInviteUrl
        if (!url) return
        await navigator.clipboard.writeText(url)
        toast.success('Link copiado.')
    }

    const handleRevokeInvite = async (inviteId: string) => {
        const id = toast.loading('Revogando convite...')
        try {
            const res = await fetch(`/api/clinica/invite/${inviteId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Erro')
            toast.success('Convite revogado.', { id })
            await loadData()
        } catch (err: any) {
            toast.error(err.message || 'Erro.', { id })
        }
    }

    const handleRemoveMember = async (userId: string, isSelf: boolean) => {
        const label = isSelf ? 'Tem certeza que deseja sair da clínica?' : 'Remover este membro?'
        if (!window.confirm(label)) return
        const id = toast.loading(isSelf ? 'Saindo...' : 'Removendo...')
        try {
            const res = await fetch(`/api/clinica/member/${userId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error((await res.json()).error || 'Erro')
            toast.success(isSelf ? 'Você saiu da clínica.' : 'Membro removido.', { id })
            if (isSelf) {
                window.location.href = '/dashboard'
            } else {
                await loadData()
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro.', { id })
        }
    }

    // ─────────────────────────────────── UI ───────────────────────────────────

    if (!initialHasOrg) {
        return (
            <div className="space-y-8">
                <header>
                    <h1 className="text-3xl font-black tracking-tight">Minha Clínica</h1>
                    <p className="text-muted-foreground mt-1">Crie uma clínica e compartilhe o plano com sua equipe.</p>
                </header>

                <section className="bg-card/40 border border-border/40 rounded-3xl p-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Criar nova clínica</h2>
                            <p className="text-sm text-muted-foreground">Você será o responsável (owner) e poderá convidar até 10 veterinários.</p>
                        </div>
                    </div>
                    <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                        <Input
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            placeholder="Nome da clínica (ex: VetCare Santos)"
                            className="flex-1"
                            required
                            minLength={2}
                            maxLength={120}
                        />
                        <Button type="submit" disabled={creating} className="bg-purple-600 hover:bg-purple-700">
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar clínica'}
                        </Button>
                    </form>
                    <p className="text-xs text-muted-foreground">
                        Ao criar uma clínica, você passa a administrar o plano Clínica (600 consultas/mês compartilhadas).
                        A assinatura pode ser feita em <a href="/assinatura" className="text-teal-600 underline">/assinatura</a> após a criação.
                    </p>
                </section>
            </div>
        )
    }

    if (loading || !data?.organization) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
        )
    }

    const { organization, members, invites, currentUserRole } = data
    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'
    const roleBadge: Record<Role, { label: string; color: string; icon: typeof Crown }> = {
        owner: { label: 'Responsável', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Crown },
        admin: { label: 'Administrador', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: ShieldCheck },
        vet:   { label: 'Veterinário',   color: 'bg-teal-500/10 text-teal-600 border-teal-500/30',     icon: Stethoscope },
    }

    return (
        <div className="space-y-8">
            <header className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">{organization.nome}</h1>
                    <p className="text-muted-foreground text-sm">
                        Plano {organization.plano} · {organization.status === 'ativo' ? 'Ativo' : organization.status}
                        {organization.data_vencimento && ` · vence em ${new Date(organization.data_vencimento).toLocaleDateString('pt-BR')}`}
                    </p>
                </div>
                {currentUserRole !== 'owner' && (
                    <Button
                        variant="outline"
                        onClick={() => handleRemoveMember(currentUserId, true)}
                        className="text-red-600 border-red-500/30 hover:bg-red-500/10"
                    >
                        <LogOut className="w-4 h-4 mr-2" /> Sair da clínica
                    </Button>
                )}
            </header>

            {/* Members */}
            <section className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-teal-500" /> Equipe ({members.length})
                </h2>
                <div className="space-y-2">
                    {members.map((m) => {
                        const badge = roleBadge[m.role]
                        const Icon = badge.icon
                        return (
                            <div key={m.user_id} className="flex items-center justify-between p-3 rounded-2xl border border-border/40 hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-2 rounded-xl border ${badge.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{m.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                    {canManage && m.role !== 'owner' && m.user_id !== currentUserId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveMember(m.user_id, false)}
                                            className="text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Invites */}
            {canManage && (
                <section className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Mail className="w-5 h-5 text-purple-500" /> Convidar veterinário
                    </h2>
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                        <Input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colega@clinica.com"
                            className="flex-1"
                            required
                        />
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'vet')}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="vet">Veterinário</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <Button type="submit" disabled={inviting} className="bg-teal-500 hover:bg-teal-600 text-white">
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Convidar'}
                        </Button>
                    </form>

                    {lastInviteUrl && (
                        <div className="p-3 rounded-2xl border border-teal-500/30 bg-teal-500/5 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                            <code className="text-xs flex-1 truncate">{lastInviteUrl}</code>
                            <Button size="sm" variant="ghost" onClick={() => handleCopyInvite()}>
                                <Copy className="w-3 h-3 mr-1" /> Copiar
                            </Button>
                        </div>
                    )}

                    {invites.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Convites pendentes</Label>
                            {invites.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40">
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate text-sm">{inv.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {inv.role === 'admin' ? 'Administrador' : 'Veterinário'} ·
                                            Expira em {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRevokeInvite(inv.id)}
                                            className="text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}
