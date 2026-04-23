import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Building2, AlertCircle, CheckCircle2 } from 'lucide-react'
import AcceptButton from './AcceptButton'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function AceitarConvitePage(props: {
    params: Promise<{ token: string }>
}) {
    const { token } = await props.params

    if (!UUID_RE.test(token)) return <ErrorShell message="Link inválido." />

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    const { data: invite } = await admin
        .from('organization_invites')
        .select('id, organization_id, email, role, expires_at, accepted_at')
        .eq('token', token)
        .maybeSingle()

    if (!invite) return <ErrorShell message="Convite não encontrado." />
    if (invite.accepted_at) return <ErrorShell message="Este convite já foi utilizado." />
    if (new Date(invite.expires_at).getTime() < Date.now())
        return <ErrorShell message="Este convite expirou. Peça um novo ao responsável da clínica." />

    const { data: org } = await admin
        .from('organizations')
        .select('nome')
        .eq('id', invite.organization_id)
        .maybeSingle()

    if (!user) {
        // Não logado → redireciona para login com retorno
        redirect(`/login?redirect=${encodeURIComponent(`/clinica/aceitar/${token}`)}`)
    }

    const emailMatch = user.email?.toLowerCase() === invite.email.toLowerCase()

    return (
        <main className="max-w-lg mx-auto px-4 py-16">
            <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
                    <Building2 className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Convite para {org?.nome ?? 'clínica'}</h1>
                    <p className="text-muted-foreground mt-2">
                        Você foi convidado como <strong>{invite.role === 'admin' ? 'administrador' : 'veterinário'}</strong>.
                    </p>
                </div>

                {!emailMatch ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm text-left">
                        <p className="flex items-start gap-2 text-amber-700 font-semibold">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            Este convite é para <strong>{invite.email}</strong>, mas você está logado como <strong>{user.email}</strong>.
                        </p>
                        <p className="mt-2 text-amber-600">Saia da conta atual e entre com o e-mail correto.</p>
                    </div>
                ) : (
                    <AcceptButton token={token} />
                )}

                <Link href="/dashboard" className="text-xs text-muted-foreground hover:underline block">
                    Voltar ao dashboard
                </Link>
            </div>
        </main>
    )
}

function ErrorShell({ message }: { message: string }) {
    return (
        <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tight">Convite indisponível</h1>
                <p className="text-muted-foreground mt-2">{message}</p>
            </div>
            <Link href="/dashboard">
                <Button variant="outline">Voltar ao dashboard</Button>
            </Link>
        </main>
    )
}
