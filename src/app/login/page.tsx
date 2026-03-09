import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PawPrint } from 'lucide-react'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams;
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-transparent">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-pulse-soft -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse-soft delay-1000 -z-10" />

            <Card className="mx-auto w-full max-w-md shadow-2xl border-amber-500/20 bg-background/80 backdrop-blur-xl animate-fade-in-up">
                <CardHeader className="space-y-2 text-center pb-8 border-b border-amber-500/10 mb-6 bg-gradient-to-b from-amber-500/5 to-transparent rounded-t-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 animate-float">
                        <PawPrint className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground pt-4">Vet AI</CardTitle>
                    <CardDescription className="text-base font-medium">
                        ClinicScribe - Inteligência Artificial para Clínicas Veterinárias
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-8">
                    {searchParams?.error && (
                        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive font-semibold text-center animate-fade-in-up">
                            {searchParams.error}
                        </div>
                    )}
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/60 p-1">
                            <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all duration-300">Login</TabsTrigger>
                            <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all duration-300">Cadastro</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="animate-fade-in-up">
                            <form>
                                <div className="grid gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email-login">E-mail</Label>
                                        <Input
                                            id="email-login"
                                            name="email"
                                            type="email"
                                            placeholder="doutor(a)@clinica.com"
                                            required
                                            autoComplete="email"
                                            className="h-11 bg-background/50 focus-visible:ring-amber-500"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password-login">Senha</Label>
                                            <a href="#" className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-medium">Esqueceu a senha?</a>
                                        </div>
                                        <Input id="password-login" name="password" type="password" required autoComplete="current-password" className="h-11 bg-background/50 focus-visible:ring-amber-500" />
                                    </div>
                                    <Button formAction={login} type="submit" className="w-full h-11 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base shadow-md shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02]">
                                        Entrar no Sistema
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="animate-fade-in-up">
                            <form>
                                <div className="grid gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email-signup">E-mail</Label>
                                        <Input
                                            id="email-signup"
                                            name="email"
                                            type="email"
                                            placeholder="doutor(a)@clinica.com"
                                            required
                                            autoComplete="email"
                                            className="h-11 bg-background/50 focus-visible:ring-amber-500"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password-signup">Criar Senha</Label>
                                        <Input id="password-signup" name="password" type="password" required autoComplete="new-password" className="h-11 bg-background/50 focus-visible:ring-amber-500" />
                                    </div>
                                    <Button formAction={signup} type="submit" className="w-full h-11 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base shadow-md shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02]">
                                        Criar Conta Grátis
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
