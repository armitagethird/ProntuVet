'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LEGAL_VERSION } from '@/lib/legal'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error('Login Supabase Error:', error)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

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
            `/login?error=${encodeURIComponent('É necessário aceitar os Termos de Uso e a Política de Privacidade para criar sua conta.')}`,
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
            `/login?error=${encodeURIComponent('Este CPF já está cadastrado em outra conta. Recupere sua senha ou use outro CPF.')}`,
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

        redirect(`/login?error=${encodeURIComponent(friendlyMessage)}`)
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
    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
