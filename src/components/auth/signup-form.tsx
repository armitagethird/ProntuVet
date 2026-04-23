'use client'

import { useState } from 'react'
import { signup } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function SignupForm() {
    const [specialization, setSpecialization] = useState<string>('')
    const [cpf, setCpf] = useState('')

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length > 11) value = value.slice(0, 11)
        
        // Apply mask: 000.000.000-00
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4')
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2')
        }
        
        setCpf(value)
    }

    return (
        <form action={signup}>
            <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="first_name">Nome</Label>
                        <Input
                            id="first_name"
                            name="first_name"
                            type="text"
                            placeholder="Ana"
                            required
                            className="bg-background/50 focus-visible:ring-teal-500"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="last_name">Sobrenome</Label>
                        <Input
                            id="last_name"
                            name="last_name"
                            type="text"
                            placeholder="Silva"
                            required
                            className="bg-background/50 focus-visible:ring-teal-500"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        required
                        className="bg-background/50 focus-visible:ring-teal-500"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                        id="cpf"
                        name="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={handleCpfChange}
                        required
                        className="bg-background/50 focus-visible:ring-teal-500 font-mono tracking-wider"
                    />
                    <p className="text-[10px] text-muted-foreground px-1 uppercase tracking-tighter">O CPF deve ser único por conta</p>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="specialization">Especialização Veterinária</Label>
                    <Select name="specialization" onValueChange={(value: string | null) => setSpecialization(value ?? '')} required>
                        <SelectTrigger className="bg-background/50 focus-visible:ring-teal-500">
                            <SelectValue placeholder="Selecione sua área" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="clinica_geral">Clínica Geral</SelectItem>
                            <SelectItem value="cirurgia">Cirurgia</SelectItem>
                            <SelectItem value="dermatologia">Dermatologia</SelectItem>
                            <SelectItem value="ortopedia">Ortopedia</SelectItem>
                            <SelectItem value="oftalmologia">Oftalmologia</SelectItem>
                            <SelectItem value="outros">Outro...</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {specialization === 'outros' && (
                    <div className="grid gap-2 animate-fade-in-up">
                        <Label htmlFor="specialization_other">Qual especialidade?</Label>
                        <Input
                            id="specialization_other"
                            name="specialization_other"
                            type="text"
                            placeholder="Digite sua especialidade"
                            required
                            className="bg-background/50 focus-visible:ring-teal-500"
                        />
                    </div>
                )}

                <div className="grid gap-2">
                    <Label htmlFor="email-signup">E-mail</Label>
                    <Input
                        id="email-signup"
                        name="email"
                        type="email"
                        placeholder="doutor(a)@clinica.com"
                        required
                        autoComplete="email"
                        className="bg-background/50 focus-visible:ring-teal-500"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password-signup">Criar Senha</Label>
                    <Input
                        id="password-signup"
                        name="password"
                        type="password"
                        required
                        autoComplete="new-password"
                        className="bg-background/50 focus-visible:ring-teal-500"
                    />
                </div>

                <label className="flex items-start gap-2 text-xs text-muted-foreground mt-1 cursor-pointer">
                    <input
                        type="checkbox"
                        name="lgpd_consent"
                        required
                        className="mt-0.5 accent-teal-500"
                    />
                    <span>
                        Li e aceito os{' '}
                        <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline font-semibold">Termos de Uso</a>{' '}
                        e a{' '}
                        <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline font-semibold">Política de Privacidade</a>.
                        Declaro ser o controlador dos dados de tutores e animais que inserir na plataforma.
                    </span>
                </label>

                <Button type="submit" className="w-full h-11 mt-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold text-base shadow-md shadow-teal-500/20 transition-all duration-300 hover:scale-[1.02]">
                    Criar Conta Grátis
                </Button>
            </div>
        </form>
    )
}
