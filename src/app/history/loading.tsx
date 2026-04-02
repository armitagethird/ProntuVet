import { Clock, ArrowLeft } from 'lucide-react'

export default function HistoryLoading() {
    return (
        <div className="flex-1 w-full max-w-5xl mx-auto space-y-8 pt-8 px-4 pb-16">
            {/* Cabeçalho Skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-10">
                <div className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium h-10 px-4 py-2 text-muted-foreground self-start mt-1 opacity-50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </div>
                <div className="flex-1">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Clock className="w-8 h-8 text-teal-500/50" />
                        Histórico de Consultas
                    </h1>
                    <div className="h-6 w-72 bg-muted/50 rounded mt-2 animate-pulse" />
                </div>
            </div>

            {/* Lista Skeleton */}
            <div className="space-y-4 mt-8">
                {/* Search Bar Skeleton */}
                <div className="flex gap-4 mb-8">
                     <div className="w-full h-12 bg-muted/30 rounded-xl animate-pulse" />
                     <div className="w-32 h-12 bg-muted/30 rounded-xl animate-pulse" />
                </div>
                
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col md:flex-row p-5 w-full bg-card/40 border border-border/40 rounded-3xl animate-pulse gap-6 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 shrink-0" />
                        <div className="flex-1 space-y-3 w-full">
                            <div className="h-5 w-48 bg-muted/50 rounded" />
                            <div className="h-4 w-32 bg-muted/40 rounded" />
                        </div>
                        <div className="hidden md:flex flex-col items-end space-y-3">
                            <div className="h-5 w-24 bg-muted/50 rounded" />
                            <div className="h-8 w-24 bg-muted/40 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
