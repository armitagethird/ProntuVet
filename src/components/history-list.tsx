'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dog, FileText, Calendar, Search, Tag as TagIcon, LayoutList, PawPrint } from 'lucide-react'
import Link from 'next/link'

interface Consultation {
    id: string
    title: string
    mode: string
    created_at: string
    tags?: string[]
    tutor_name?: string
    structured_content?: any
    animals?: { name: string; species: string }
}

export function HistoryList({ initialData }: { initialData: Consultation[] }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'list' | 'animal'>('list')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    // Extract all unique tags for the filter pill list
    const allTags = useMemo(() => {
        const tags = new Set<string>()
        initialData.forEach(c => {
            if (c.tags && Array.isArray(c.tags)) {
                c.tags.forEach(t => tags.add(t))
            }
        })
        return Array.from(tags)
    }, [initialData])

    // Filter consultations based on search and selected tag
    const filteredData = useMemo(() => {
        return initialData.filter(c => {
            const matchesSearch = searchQuery === '' ||
                c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.tutor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.animals?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.tags && c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                (c.structured_content && JSON.stringify(c.structured_content).toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesTag = selectedTag === null || (c.tags && c.tags.includes(selectedTag));

            return matchesSearch && matchesTag;
        })
    }, [initialData, searchQuery, selectedTag])

    // Group by animal if in animal view mode
    const groupedData = useMemo(() => {
        if (viewMode !== 'animal') return null;

        const groups: Record<string, Consultation[]> = {};
        const unassigned: Consultation[] = [];

        filteredData.forEach(c => {
            // Check if it's connected to an animal
            if (c.animals?.name) {
                const name = c.animals.name;
                if (!groups[name]) groups[name] = [];
                groups[name].push(c);
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
                            <Dog className="w-6 h-6" />
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
                    {consultation.tags && consultation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {consultation.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                                    {tag}
                                </span>
                            ))}
                            {consultation.tags.length > 3 && (
                                <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                    +{consultation.tags.length - 3}
                                </span>
                            )}
                        </div>
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por animal, tutor, tag ou conteúdo..."
                            className="pl-10 h-12 bg-background/80 rounded-full border-border/60 focus-visible:ring-teal-500 shadow-sm"
                        />
                    </div>

                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'animal')} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-2 h-12 rounded-full p-1 bg-muted/60">
                            <TabsTrigger value="list" className="rounded-full flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm">
                                <LayoutList className="w-4 h-4" /> Lista
                            </TabsTrigger>
                            <TabsTrigger value="animal" className="rounded-full flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 data-[state=active]:shadow-sm">
                                <PawPrint className="w-4 h-4" /> Por Animal
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <TagIcon className="w-4 h-4 text-muted-foreground mr-1" />
                        <Button
                            variant={selectedTag === null ? "default" : "outline"}
                            size="sm"
                            className={`rounded-full h-8 text-xs ${selectedTag === null ? 'bg-teal-500 hover:bg-teal-600' : ''}`}
                            onClick={() => setSelectedTag(null)}
                        >
                            Todas
                        </Button>
                        {allTags.map(tag => (
                            <Button
                                key={tag}
                                variant={selectedTag === tag ? "default" : "outline"}
                                size="sm"
                                className={`rounded-full h-8 text-xs ${selectedTag === tag ? 'bg-blue-500 hover:bg-blue-600 border-none' : 'hover:border-blue-500/50 hover:text-blue-600'}`}
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                )}
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
                            onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                        >
                            Limpar filtros
                        </Button>
                    )}
                </div>
            ) : viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map((consultation, index) => renderCard(consultation, index))}
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Animal groups */}
                    {groupedData && Object.entries(groupedData.groups).length > 0 && (
                        <div className="space-y-10">
                            {Object.entries(groupedData.groups).sort().map(([animalName, cons], groupIndex) => (
                                <div key={animalName} className="space-y-4">
                                    <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                                        <div className="p-2 bg-teal-500/10 rounded-lg text-teal-600">
                                            <PawPrint className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-foreground capitalize">{animalName}</h2>
                                        <span className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-semibold text-muted-foreground ml-2">
                                            {cons.length} {cons.length === 1 ? 'consulta' : 'consultas'}
                                        </span>
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
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                                <h2 className="text-2xl font-bold text-foreground/70">Pacientes Não Especificados</h2>
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
