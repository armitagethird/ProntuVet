import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SignupForm } from '@/components/auth/signup-form'
import { PawPrint } from 'lucide-react'
import Image from 'next/image'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams;
    return (
        <div className="flex min-h-screen w-full bg-background">
            {/* Seção Esquerda / Superior : Formulário */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="w-full max-w-[420px] space-y-8">
                    {/* Cabeçalho do Form */}
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start mb-4">
                            <Image src="/logo.png" alt="ProntuVet Logo" width={96} height={96} className="object-contain drop-shadow-sm" priority />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                            ProntuVet
                        </h1>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Bem-vindo de volta
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium">
                            O seu software veterinário inteligente
                        </p>
                    </div>

                    {searchParams?.error && (
                        <div className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-4 text-sm text-destructive font-semibold shadow-sm animate-in fade-in">
                            {searchParams.error}
                        </div>
                    )}

                    {/* Guias Login / Cadastro */}
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl mb-6">
                            <TabsTrigger value="login" className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                Entrar
                            </TabsTrigger>
                            <TabsTrigger value="signup" className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                Cadastro
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <form action={login}>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email-login" className="font-semibold">E-mail</Label>
                                        <Input
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
                                    
                                    <div className="relative my-6 text-center">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-border/60"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-3 text-muted-foreground font-bold tracking-wider">Seguro & Criptografado</span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-card p-6 rounded-2xl border shadow-sm">
                                <SignupForm />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Seção Direita : Imagem Cover (Escondida em Mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1596272875729-ea2713a34a44?q=80&w=2000&auto=format&fit=crop" 
                        alt="Clínica Veterinária" 
                        className="object-cover w-full h-full opacity-60 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent mix-blend-multiply"></div>
                </div>
                
                <div className="relative z-10 max-w-lg text-white space-y-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-150">
                    <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-md">
                        <PawPrint className="mr-2 h-4 w-4" /> Inteligência Artificial Veterinária
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                        Transforme o atendimento da sua clínica.
                    </h2>
                    <p className="text-lg text-zinc-300 font-medium leading-relaxed">
                        Reduza o tempo em triagens e melhore seus diagnósticos consultando nosso assistente de IA treinado com milhares de casos clínicos reais.
                    </p>
                    
                    {/* Mock de Testimonial ou Feature list pequena */}
                    <div className="pt-8 border-t border-white/20 mt-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <span className="font-bold text-xl">🚀</span>
                            </div>
                            <div>
                                <p className="font-bold text-lg">70% mais rápido</p>
                                <p className="text-sm text-zinc-400">na documentação de prontuários.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


