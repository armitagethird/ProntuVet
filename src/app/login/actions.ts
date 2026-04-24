'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LEGAL_VERSION } from '@/lib/legal'

function safeRedirect(raw: FormDataEntryValue | null): string {
    if (typeof raw !== 'string') return '/dashboard'
    if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
    return raw
}

function loginErrorUrl(message: string, redirectTo: string, tab?: 'login' | 'signup'): string {
    const qs = new URLSearchParams({ error: message })
    if (redirectTo !== '/dashboard') qs.set('redirect', redirectTo)
    if (tab) qs.set('tab', tab)
    return `/login?${qs.toString()}`
}

export async function login(formData: FormData) {
    const supabase = await createClient()
    const redirectTo = safeRedirect(formData.get('redirectTo'))

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error('Login Supabase Error:', error)
        redirect(loginErrorUrl(error.message, redirectTo))
    }

    revalidatePath('/', 'layout')
    redirect(redirectTo)
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const redirectTo = safeRedirect(formData.get('redirectTo'))

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string
    const birthDate = formData.get('birth_date') as string
    const specialization =
        (formData.get('specialization_other') as string) ||
        (formData.get('specialization') as string)
    const rawCpf = formData.get('cpf') as string
    const cpf = rawCpf.replace(/\D/g, '')
    const lgpdConsent = formData.get('lgpd_consent')

    if (!lgpdConsent) {
        redirect(
            loginErrorUrl('É necessário aceitar os Termos de Uso e a Política de Privacidade para criar sua conta.', redirectTo, 'signup'),
        )
    }

    // Verificação proativa de CPF duplicado (antes do trigger falhar)
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', cpf)
        .single()

    if (existingProfile) {
        redirect(
            loginErrorUrl('Este CPF já está cadastrado em outra conta. Recupere sua senha ou use outro CPF.', redirectTo, 'signup'),
        )
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate,
                specialization,
                cpf,
            },
        },
    })

    if (error) {
        console.error('Signup Supabase Error:', error)

        let friendlyMessage = error.message
        if (error.message.includes('User already registered')) {
            friendlyMessage = 'Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.'
        } else if (error.message.includes('Password should be')) {
            friendlyMessage = 'A senha deve ter pelo menos 6 caracteres.'
        } else if (error.message.includes('Database error saving new user')) {
            friendlyMessage = 'Ocorreu um erro ao salvar seus dados. Verifique se o CPF ou e-mail já estão em uso.'
        }

        redirect(loginErrorUrl(friendlyMessage, redirectTo, 'signup'))
    }

    // Registra o aceite LGPD. Tolerante a falhas para não bloquear cadastro.
    if (signUpData?.user?.id) {
        await supabase
            .from('profiles')
            .update({
                lgpd_accepted_at: new Date().toISOString(),
                lgpd_version: LEGAL_VERSION,
            })
            .eq('id', signUpData.user.id)
    }

    revalidatePath('/', 'layout')
    redirect(redirectTo)
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
