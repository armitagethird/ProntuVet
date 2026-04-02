import { User, Shield, Key, PawPrint } from 'lucide-react'

export default function ProfileLoading() {
    return (
        <div className="flex-1 flex flex-col items-center justify-start max-w-4xl mx-auto w-full pt-8 pb-32 space-y-8 px-4">
            
            {/* Header Skeleton */}
            <div className="w-full flex flex-col md:flex-row gap-6 items-center bg-card/60 border border-border/50 rounded-3xl p-8 backdrop-blur-xl">
                <div className="w-24 h-24 rounded-full bg-muted/50 border-4 border-background animate-pulse" />
                
                <div className="text-center md:text-left flex-1 space-y-3 w-full md:w-auto flex flex-col items-center md:items-start">
                    <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
                    <div className="h-5 w-64 bg-muted/40 rounded animate-pulse" />
                </div>

                <div className="w-full sm:w-24 h-10 bg-muted/50 rounded-full animate-pulse" />
            </div>

            {/* Configs Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                
                {/* Info Card */}
                <div className="space-y-6 bg-card/40 border border-border/40 rounded-3xl p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-muted-foreground opacity-50">
                        <Shield className="w-5 h-5" /> Informações
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <div className="h-4 w-24 bg-muted/40 rounded animate-pulse" />
                             <div className="h-10 w-full bg-muted/30 rounded-xl animate-pulse" />
                        </div>
                        <div className="space-y-2">
                             <div className="h-4 w-16 bg-muted/40 rounded animate-pulse" />
                             <div className="h-10 w-full bg-muted/30 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="space-y-6 bg-card/40 border border-border/40 rounded-3xl p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-muted-foreground opacity-50">
                        <Key className="w-5 h-5" /> Segurança
                    </h2>
                    <div className="p-4 bg-muted/20 border border-border/30 rounded-2xl animate-pulse">
                        <div className="h-4 w-48 bg-muted/40 rounded mb-4" />
                        <div className="h-10 w-full bg-muted/30 rounded-xl" />
                    </div>
                </div>

                {/* Pets Card */}
                <div className="md:col-span-2 space-y-6 bg-card/40 border border-border/40 rounded-3xl p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-muted-foreground opacity-50">
                        <PawPrint className="w-5 h-5" /> Meus Pets
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="h-10 w-full bg-muted/30 rounded-xl animate-pulse" />
                        <div className="h-10 w-full bg-muted/30 rounded-xl animate-pulse" />
                        <div className="h-10 w-32 bg-muted/40 rounded-xl animate-pulse" />
                    </div>
                </div>

            </div>
        </div>
    )
}
