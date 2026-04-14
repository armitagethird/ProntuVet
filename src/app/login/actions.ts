'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error("Login Supabase Error:", error)
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
    const specialization = formData.get('specialization_other') || formData.get('specialization') as string
    const rawCpf = formData.get('cpf') as string
    const cpf = rawCpf.replace(/\D/g, '') // Normalize: keep only digits

    // 1. Proactive CPF Check (Best Practice: check before trigger fails)
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', cpf)
        .single()

    if (existingProfile) {
        redirect(`/login?error=${encodeURIComponent('Este CPF já está cadastrado em outra conta. Por favor, recupere sua senha ou use outro CPF.')}`)
    }

    // 2. Attempt Signup
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate,
                specialization: specialization,
                cpf: cpf,
            }
        }
    })

    if (error) {
        console.error("Signup Supabase Error:", error)
        
        // Translate common Supabase Auth errors
        let friendlyMessage = error.message
        if (error.message.includes('User already registered')) {
            friendlyMessage = 'Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.'
        } else if (error.message.includes('Password should be')) {
            friendlyMessage = 'A senha deve ter pelo menos 6 caracteres.'
        } else if (error.message.includes('Database error saving new user')) {
            friendlyMessage = 'Ocorreu um erro ao salvar seus dados. Verifique se o CPF ou E-mail já estão em uso.'
        }

        redirect(`/login?error=${encodeURIComponent(friendlyMessage)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
