import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AssinaturaCanceladoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Pagamento cancelado
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Você cancelou o processo. Sempre que quiser assinar o Platinum, é só voltar e tentar novamente.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="rounded-xl px-8 h-12">
          <Link href="/dashboard">Continuar grátis</Link>
        </Button>
        <Button asChild className="rounded-xl px-8 h-12 bg-green-600 hover:bg-green-700 text-white font-bold">
          <Link href="/assinatura">Tentar novamente</Link>
        </Button>
      </div>
    </div>
  )
}
