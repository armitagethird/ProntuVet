'use client'

import { login } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginFormProps {
    redirectTo?: string
    autoFocus?: boolean
    onSwitchToSignup?: () => void
}

export function LoginForm({ redirectTo, autoFocus, onSwitchToSignup }: LoginFormProps) {
    return (
        <form action={login}>
            {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
            <div className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email-login" className="font-semibold">E-mail</Label>
                    <Input
                        autoFocus={autoFocus}
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

                {onSwitchToSignup && (
                    <p className="text-center text-sm text-muted-foreground pt-1">
                        Não tem conta?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignup}
                            className="font-bold text-primary hover:underline transition-colors"
                        >
                            Criar conta grátis
                        </button>
                    </p>
                )}

                <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/60"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 text-muted-foreground font-bold tracking-wider">Seguro & Criptografado</span>
                    </div>
                </div>
            </div>
        </form>
    )
}
