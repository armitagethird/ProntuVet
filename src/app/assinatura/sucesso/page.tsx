import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AssinaturaSucessoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Bem-vindo ao Platinum!
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Seu pagamento foi confirmado. O plano Platinum já está ativo na sua conta — aproveite ao máximo!
        </p>
      </div>

      <Button asChild className="rounded-xl px-8 h-12 bg-green-600 hover:bg-green-700 text-white font-bold">
        <Link href="/dashboard">Ir para o Dashboard</Link>
      </Button>
    </div>
  )
}
