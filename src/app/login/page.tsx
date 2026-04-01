import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SignupForm } from '@/components/auth/signup-form'
import Image from 'next/image'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams;
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-transparent mt-12 mb-12">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl animate-pulse-soft -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-soft delay-1000 -z-10" />

            <Card className="mx-auto w-full max-w-md shadow-2xl border-teal-500/20 bg-background/80 backdrop-blur-xl animate-fade-in-up">
                <CardHeader className="space-y-2 text-center pb-8 border-b border-teal-500/10 mb-6 bg-gradient-to-b from-teal-500/5 to-transparent rounded-t-xl">
                    <div className="w-40 h-40 mx-auto -mt-10 flex animate-float drop-shadow-xl items-center justify-center">
                        <Image src="/logo.png" alt="ProntuVet Logo" width={160} height={160} className="object-contain" priority />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground pt-0">ProntuVet</CardTitle>
                    <CardDescription className="text-base font-medium">
                        O seu software veterinário inteligente
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
                            <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all duration-300">Login</TabsTrigger>
                            <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all duration-300">Cadastro</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="animate-fade-in-up">
                            <form action={login}>
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
                                            className="h-11 bg-background/50 focus-visible:ring-teal-500"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password-login">Senha</Label>
                                            <a href="#" className="text-xs text-teal-600 hover:text-teal-700 hover:underline font-medium">Esqueceu a senha?</a>
                                        </div>
                                        <Input id="password-login" name="password" type="password" required autoComplete="current-password" className="h-11 bg-background/50 focus-visible:ring-teal-500" />
                                    </div>
                                    <Button type="submit" className="w-full h-11 mt-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold text-base shadow-md shadow-teal-500/20 transition-all duration-300 hover:scale-[1.02]">
                                        Entrar no Sistema
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="animate-fade-in-up">
                            <SignupForm />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

