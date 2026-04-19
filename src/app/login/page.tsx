"use client"

import React, { useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SignupForm } from '@/components/auth/signup-form'
import { PawPrint, Brain, Clock, Shield, Sparkles, Heart, X } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface CardData {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    icon: any;
    color: string;
    accentColor: string;
}

const cards: CardData[] = [
    {
        id: 'scribe',
        title: 'IA Scribe',
        description: 'Transcreve e resume suas consultas em segundos.',
        longDescription: 'Nossa IA exclusiva ouve e processa os termos técnicos veterinários, diferenciando espécies e procedimentos, gerando um prontuário estruturado em segundos. Isso permite que você mantenha o contato visual com seu paciente e tutor durante todo o atendimento.',
        icon: Brain,
        color: 'bg-sky-500/20',
        accentColor: 'text-sky-300'
    },
    {
        id: 'performance',
        title: '70% Mais Rápido',
        description: 'Reduza drasticamente o tempo de documentação.',
        longDescription: 'Economize em média 15 minutos por atendimento. No final de um dia com 15 consultas, você ganha quase 4 horas livres para descansar, estudar ou atender mais casos, aumentando seu faturamento sem aumentar o estresse.',
        icon: Clock,
        color: 'bg-green-500/20',
        accentColor: 'text-green-300'
    },
    {
        id: 'security',
        title: 'Criptografado',
        description: 'Todos os dados dos seus pacientes estão protegidos.',
        longDescription: 'Segurança de nível bancário com criptografia de ponta a ponta. Seguimos rigorosamente as normas de proteção de dados sensíveis, garantindo que o histórico clínico e as informações dos tutores estejam sempre protegidos contra acessos não autorizados.',
        icon: Shield,
        color: 'bg-amber-500/20',
        accentColor: 'text-amber-300'
    },
    {
        id: 'care',
        title: 'Humanizado',
        description: 'Liberdade para focar mais no que realmente importa.',
        longDescription: 'Recupere o prazer de exercer a medicina veterinária de excelência. Ao eliminar a carga burocrática, você reduz o risco de burnout e melhora a qualidade do seu diagnóstico, oferecendo uma experiência mais humana e dedicada ao animal.',
        icon: Heart,
        color: 'bg-rose-500/20',
        accentColor: 'text-rose-300'
    }
];

export default function LoginPage(props: { searchParams: { error?: string } }) {
    const searchParams = props.searchParams;
    const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-background overflow-x-hidden">
            {/* Seção Esquerda / Superior : Formulário */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in slide-in-from-left-8 duration-700 min-h-screen lg:min-h-0">
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

                    {/* Indicador de Rolar para Mobile */}
                    <div className="flex lg:hidden flex-col items-center justify-center pt-8 animate-bounce text-muted-foreground/60">
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Conheça o ProntuVet</span>
                        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/40 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Seção Direita : Informações da Aplicação */}
            <div className="flex flex-col w-full lg:w-1/2 relative bg-sky-950 overflow-hidden items-center justify-center p-8 sm:p-12 lg:p-20 min-h-[700px] lg:min-h-screen">
                {/* Background com padrão sutil e gradientes */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=2000&auto=format&fit=crop" 
                        alt="Veterinário moderno" 
                        className="object-cover w-full h-full opacity-40 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-900/90 via-sky-950/80 to-slate-950"></div>
                    
                    {/* Elementos decorativos de luz */}
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px]"></div>
                </div>
                
                <div className="relative z-10 max-w-2xl w-full text-white space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    <div className="space-y-4 text-center lg:text-left pt-12 lg:pt-0">
                        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight leading-[1.1]">
                            Foco total na <span className="text-sky-400">saúde animal</span>,<br className="hidden sm:block" />
                            com menos papelada.
                        </h2>
                        <p className="text-base sm:text-lg text-sky-100/80 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Otimize sua rotina com o assistente inteligente que entende a linguagem clínica e acelera seus processos.
                        </p>
                    </div>
                    
                    {/* Grid de Cards Informativos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {cards.map((card) => (
                            <motion.div 
                                key={card.id}
                                onClick={() => setSelectedCard(card)}
                                whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                className="group relative p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all cursor-pointer overflow-hidden"
                            >
                                <div className={`h-10 w-10 rounded-2xl ${card.color} flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform mx-auto lg:mx-0`}>
                                    <card.icon className={`h-5 w-5 ${card.accentColor}`} />
                                </div>
                                <h3 className="font-bold text-center lg:text-left text-lg mb-1">{card.title}</h3>
                                <p className="text-sm text-center lg:text-left text-sky-100/60 leading-snug">{card.description}</p>
                                
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="h-4 w-4 text-sky-400/50" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer Social Proof sutil */}
                    <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-sky-900 bg-sky-800 flex items-center justify-center overflow-hidden">
                                     <Image 
                                        src={`https://i.pravatar.cc/150?u=${i + 10}`} 
                                        alt="User" 
                                        width={40} 
                                        height={40} 
                                        className="opacity-50 grayscale hover:grayscale-0 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm leading-relaxed text-sky-100/90 font-medium italic">
                                "O ProntuVet mudou minha rotina. Agora consigo dar atenção real aos meus pacientes sem me preocupar com o tempo de digitação."
                            </p>
                            <p className="text-xs mt-1 text-sky-400 font-bold uppercase tracking-wider">
                                — Dra. Carla Maysa, Veterinária
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Card Expandido */}
            <AnimatePresence>
                {selectedCard && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCard(null)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            layoutId={selectedCard.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-white/20 rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden"
                        >
                            <div className="p-8 sm:p-10">
                                <button 
                                    onClick={() => setSelectedCard(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                >
                                    <X className="h-5 w-5 text-white/60" />
                                </button>

                                <div className={`h-16 w-16 rounded-[2rem] ${selectedCard.color} flex items-center justify-center mb-8 border border-white/10`}>
                                    <selectedCard.icon className={`h-8 w-8 ${selectedCard.accentColor}`} />
                                </div>

                                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
                                    {selectedCard.title}
                                </h2>
                                
                                <p className="text-xl font-medium text-sky-300 mb-6 leading-tight">
                                    {selectedCard.description}
                                </p>

                                <div className="space-y-4">
                                    <p className="text-lg text-slate-300 leading-relaxed font-medium">
                                        {selectedCard.longDescription}
                                    </p>
                                    
                                    <div className="pt-6">
                                        <Button 
                                            onClick={() => setSelectedCard(null)}
                                            className="w-full h-14 rounded-2xl bg-white text-slate-950 hover:bg-white/90 font-bold text-lg transition-transform active:scale-95"
                                        >
                                            Entendi, incrível!
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Efeito decorativo no fundo do modal */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}



