import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AssinaturaExpiradoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
        <Clock className="w-10 h-10 text-amber-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Link de pagamento expirado
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          O tempo para concluir o pagamento esgotou. Não se preocupe — gere um novo link e finalize a assinatura.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="rounded-xl px-8 h-12">
          <Link href="/dashboard">Continuar grátis</Link>
        </Button>
        <Button asChild className="rounded-xl px-8 h-12 bg-green-600 hover:bg-green-700 text-white font-bold">
          <Link href="/assinatura">Gerar novo link</Link>
        </Button>
      </div>
    </div>
  )
}
