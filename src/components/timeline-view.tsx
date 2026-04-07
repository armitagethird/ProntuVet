'use client'

import { motion } from 'framer-motion'
import { Calendar, ChevronRight, Activity } from 'lucide-react'
import Link from 'next/link'

interface TimelineEvent {
    id: string
    title: string
    date: string
    resumo_trilha: string | null
    tags?: string[]
}

interface TimelineViewProps {
    animalName: string
    events: TimelineEvent[]
    isSidebar?: boolean
}

export function TimelineView({ animalName, events, isSidebar = false }: TimelineViewProps) {
    if (!events || events.length === 0) {
        return (
            <div className="text-center py-20 bg-card/40 border border-dashed border-border/60 rounded-3xl">
                <p className="text-muted-foreground">Nenhuma consulta registrada para criar uma trilha clínica.</p>
            </div>
        )
    }

    return (
        <div className="relative min-h-full pb-20">
            {/* Optimized Vertical Line - simpler approach to avoid offset bugs */}
            <div className={`absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500/30 via-blue-500/20 to-transparent ${isSidebar ? 'left-6' : 'left-6 md:left-1/2 md:-translate-x-0.5'}`}></div>

            <div className={`flex flex-col gap-10 ${isSidebar ? 'px-2' : ''}`}>
                {events.map((event, index) => (
                    <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, x: isSidebar ? -10 : (index % 2 === 0 ? -10 : 10) }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className={`relative flex items-start ${!isSidebar && index % 2 === 0 ? 'md:flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Dot Marker */}
                        <div className={`absolute w-4 h-4 rounded-full bg-background border-2 border-teal-500 shadow-sm z-10 top-6 ${isSidebar ? 'left-4' : 'left-4 md:left-1/2 md:-translate-x-2'}`}>
                            <div className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-20"></div>
                        </div>

                        {/* Content Card */}
                        <div className={`w-full ${isSidebar ? 'ml-10' : 'md:w-[calc(50%-30px)] ml-12 md:ml-0'}`}>
                            <Link href={`/consultation/${event.id}`}>
                                <div className="group bg-card/80 backdrop-blur-sm border border-border/50 p-5 rounded-2xl hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-200 cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-teal-600 uppercase tracking-tighter">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </div>

                                    <h3 className="text-base font-bold mb-1.5 group-hover:text-teal-600 transition-colors line-clamp-1">
                                        {event.title}
                                    </h3>

                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                        {event.resumo_trilha || 'Nenhum resumo clínico gerado para esta data.'}
                                    </p>

                                    {event.tags && event.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {event.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/5 text-blue-600/80 border border-blue-500/10">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
