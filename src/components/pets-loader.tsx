import Image from "next/image"

export default function PetsLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="flex flex-col items-center bg-card/50 p-10 rounded-[2.5rem] shadow-2xl border border-white/20 backdrop-blur-xl animate-in zoom-in-95 duration-500">
        <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
          {/* Anel Externo Giratório (Clean/Profissional) */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary animate-spin-slow" />
          
          {/* Logo com Pulsar Glow */}
          <div className="relative w-24 h-24 animate-logo-pulse-glow flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="ProntuVet Logo" 
              width={96} 
              height={96}
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-tighter text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            ProntuVet AI
          </h2>
          <p className="text-sm font-medium text-muted-foreground/80 tracking-wide">
            Otimizando sua consulta...
          </p>
        </div>

        {/* Barra de progresso sutil */}
        <div className="mt-8 w-48 h-1 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary/60 w-1/2 rounded-full animate-progress-loop" />
        </div>
      </div>
    </div>
  )
}

