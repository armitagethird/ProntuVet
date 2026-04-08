'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dog, Cat, Bird, Fish, Rabbit, FileText, Calendar, Search, Tag as TagIcon, LayoutList, PawPrint, History as HistoryIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Consultation {
    id: string
    title: string
    mode: string
    created_at: string
    tags?: string[]
    tutor_name?: string
    structured_content?: Record<string, string>
    animal_id?: string
    resumo_trilha?: string
    animals?: { id: string; name: string; species: string }
}

export function HistoryList({ initialData }: { initialData: Consultation[] }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'list' | 'animal'>('list')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [aiResults, setAiResults] = useState<Consultation[] | null>(null)
    const [isAISearching, setIsAISearching] = useState(false)
    const [isAIActive, setIsAIActive] = useState(false)
    const [visibleCount, setVisibleCount] = useState(12)


    // Filter consultations based on search
    const filteredData = useMemo(() => {
        // If AI search is active and has results, use those as the base
        const baseData = (isAIActive && aiResults) ? aiResults : initialData;

        return baseData.filter(c => {
            const animalName = Array.isArray(c.animals) ? c.animals[0]?.name : c.animals?.name;
            
            const matchesSearch = searchQuery === '' ||
                c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.tutor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                animalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.structured_content && JSON.stringify(c.structured_content).toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesSearch;
        })
    }, [initialData, aiResults, isAIActive, searchQuery])

    const handleAISearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 3) {
            toast.error('Digite uma busca mais detalhada para a IA.')
            return
        }

        setIsAISearching(true)
        setIsAIActive(true)
        try {
            const res = await fetch(`/api/history/search?q=${encodeURIComponent(searchQuery)}`)
            if (!res.ok) throw new Error()
            const { results } = await res.json()
            setAiResults(results)
            toast.success('Busca inteligente concluída!')
        } catch (err) {
            toast.error('Erro ao realizar busca inteligente.')
            setIsAIActive(false)
        } finally {
            setIsAISearching(false)
        }
    }

    const clearSearch = () => {
        setSearchQuery('')
        setSelectedTag(null)
        setIsAIActive(false)
        setAiResults(null)
    }

    const getAnimalIcon = (species?: string) => {
        if (!species) return <Dog className="w-6 h-6" />;
        const lowSpecies = species.toLowerCase();
        if (lowSpecies.includes('gato') || lowSpecies.includes('felin')) return <Cat className="w-6 h-6" />;
        if (lowSpecies.includes('pássaro') || lowSpecies.includes('ave') || lowSpecies.includes('passaro')) return <Bird className="w-6 h-6" />;
        if (lowSpecies.includes('peixe')) return <Fish className="w-6 h-6" />;
        if (lowSpecies.includes('coelho')) return <Rabbit className="w-6 h-6" />;
        if (lowSpecies.includes('cachorro') || lowSpecies.includes('cão') || lowSpecies.includes('canin')) return <Dog className="w-6 h-6" />;
        return <PawPrint className="w-6 h-6" />;
    };

    // Group by animal if in animal view mode
    const groupedData = useMemo(() => {
        if (viewMode !== 'animal') return null;

        const groups: Record<string, Consultation[]> = {};
        const unassigned: Consultation[] = [];

        filteredData.forEach(c => {
            const animalName = c.animals?.name;
            if (animalName) {
                if (!groups[animalName]) groups[animalName] = [];
                groups[animalName].push(c);
            } else {
                unassigned.push(c);
            }
        });

        return { groups, unassigned };
    }, [filteredData, viewMode])

    const renderCard = (consultation: Consultation, index: number) => (
        <Link key={consultation.id} href={`/consultation/${consultation.id}`} className="group h-full block">
            <Card
                style={{ animationDelay: `${(index % 10) * 50}ms` }}
                className="h-full flex flex-col border border-border/50 bg-card/60 backdrop-blur-sm hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 group-hover:-translate-y-2 relative overflow-hidden animate-fade-in-up"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <CardHeader className="pb-3 pt-6 px-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/10 to-blue-500/10 text-teal-500 group-hover:from-teal-500/20 group-hover:to-blue-500/20 group-hover:scale-110 transition-all duration-300">
                            {getAnimalIcon(consultation.animals?.species)}
                        </div>
                    </div>
                    <CardTitle className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors">
                        {consultation.title || 'Consulta sem título'}
                    </CardTitle>
                    {consultation.animals?.name && (
                        <CardDescription className="font-medium text-foreground/80 mt-1">
                            🐾 Paciente: {consultation.animals.name}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex-1 px-6 pb-2 space-y-3">
                    <div className="flex items-center text-sm font-medium text-muted-foreground pt-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(consultation.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </div>
                    {consultation.resumo_trilha && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed pt-1 border-t border-border/20">
                            "{consultation.resumo_trilha}"
                        </p>
                    )}
                </CardContent>
                <CardFooter className="pt-4 pb-6 px-6 mt-auto border-t border-border/30">
                    <div className="w-full text-left text-sm font-bold text-teal-600 opacity-80 group-hover:opacity-100 flex items-center transition-all group-hover:translate-x-1">
                        Abrir Prontuário <span className="ml-1 text-lg leading-none">→</span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Search and Filters */}
            <div className="flex flex-col gap-6 bg-card/40 border border-border/50 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                if (e.target.value === '') setIsAIActive(false)
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                            placeholder={isAIActive ? "Busca IA ativa..." : "Buscar por animal, tutor, tag..."}
                            className={`pl-10 pr-24 h-12 bg-background/80 rounded-full border-border/60 focus-visible:ring-teal-500 shadow-sm transition-all ${isAIActive ? 'border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/30' : ''}`}
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {isAIActive && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={clearSearch}
                                    className="h-9 px-3 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    Limpar
                                </Button>
                            )}
                            <Button 
                                size="sm" 
                                onClick={handleAISearch}
                                disabled={isAISearching || !searchQuery}
                                className="h-9 px-4 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-md shadow-teal-500/20 transition-all hover:scale-105"
                            >
                                {isAISearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>✨ Buscar IA</span>}
                            </Button>
                        </div>
                    </div>

                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'animal')} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-2 h-12 rounded-full p-1 bg-muted/60">
                            <TabsTrigger 
                                value="list" 
                                onClick={() => setVisibleCount(12)}
                                className="rounded-full flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm"
                            >
                                <LayoutList className="w-4 h-4" /> Lista
                            </TabsTrigger>
                            <TabsTrigger value="animal" className="rounded-full flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm">
                                <PawPrint className="w-4 h-4" /> Por Animal
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

            </div>

            {/* Results */}
            {filteredData.length === 0 ? (
                <div className="text-center py-20 px-4 bg-muted/10 rounded-3xl border border-dashed border-border/60">
                    <div className="bg-background/80 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Search className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Nenhuma consulta encontrada</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
                        Tente ajustar os termos de busca ou remover os filtros de tag.
                    </p>
                    {(searchQuery || selectedTag) && (
                        <Button
                            variant="link"
                            className="mt-4 text-teal-600"
                            onClick={clearSearch}
                        >
                            Limpar filtros
                        </Button>
                    )}
                </div>
            ) : viewMode === 'list' ? (
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.slice(0, visibleCount).map((consultation, index) => renderCard(consultation, index))}
                    </div>
                    
                    {filteredData.length > visibleCount && (
                        <div className="flex justify-center pt-8">
                            <Button 
                                variant="outline" 
                                onClick={() => setVisibleCount(prev => prev + 12)}
                                className="rounded-full px-10 h-12 border-teal-500/30 text-teal-600 hover:bg-teal-500/10 hover:border-teal-500 transition-all font-bold shadow-sm flex items-center gap-2 group"
                            >
                                <HistoryIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                Carregar Mais Consultas
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Animal groups */}
                    {groupedData && Object.entries(groupedData.groups).length > 0 && (
                        <div className="space-y-10">
                            {Object.entries(groupedData.groups).sort().map(([animalName, cons], groupIndex) => (
                                <div key={animalName} className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-600">
                                                {getAnimalIcon(cons[0]?.animals?.species)}
                                            </div>
                                            <h2 className="text-2xl font-bold text-foreground capitalize">{animalName}</h2>
                                            <span className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-semibold text-muted-foreground ml-2">
                                                {cons.length} {cons.length === 1 ? 'consulta' : 'consultas'}
                                            </span>
                                        </div>
                                        {cons[0]?.animals?.id && (
                                            <Link href={`/history/animal/${cons[0].animals.id}/timeline`}>
                                                <Button variant="outline" size="sm" className="rounded-full border-teal-500/30 text-teal-600 hover:bg-teal-500/10 hover:border-teal-500 transition-all gap-2 h-9">
                                                    <HistoryIcon className="w-4 h-4" />
                                                    Ver Trilha Clínica
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {cons.map((consultation, index) => renderCard(consultation, groupIndex * 10 + index))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Unassigned / No animal name */}
                    {groupedData && groupedData.unassigned.length > 0 && (
                        <div className="space-y-4 pt-10">
                            <div className="flex items-center justify-between pb-2 border-b border-border/40">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                                        <PawPrint className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground/70">Pacientes Não Especificados</h2>
                                </div>
                                <Link href={`/history/patient/${encodeURIComponent('Desconhecido')}/timeline`}>
                                    <Button variant="outline" size="sm" className="rounded-full border-teal-500/30 text-teal-600 hover:bg-teal-500/10 hover:border-teal-500 transition-all gap-2 h-9">
                                        <HistoryIcon className="w-4 h-4" />
                                        Ver Trilha Clínica
                                    </Button>
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                                {groupedData.unassigned.map((consultation, index) => renderCard(consultation, index))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
