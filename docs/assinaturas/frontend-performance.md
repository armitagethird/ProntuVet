# ProntuVet Frontend Performance Guidelines
**Regras Arquiteturais para Navegação e React Server Components (RSC)**

Para manter o desempenho responsivo (0ms) e métricas Core Web Vitals (FCP, LCP e INP) no ProntuVet Mobile, todos os novos componentes e rotas devem seguir estritamente o padrão **"No-RAM / Streaming"** documentado abaixo.

## 1. Zero-Await em Server Components Containers (Páginas Primárias)
Nunca trave o primeiro render da sua rota primária (`page.tsx`) aguardando uma dependência lenta (como requisições pesadas ao Supabase). Interfaces bloqueadas em rede não geram FCP imediato.

**Padrão Proibido ❌**
```tsx
// ❌ Retém o HTML inteiro bloqueado no servidor até a query finalizar:
export default async function SlowPage() {
    const { data } = await supabase.from('users').select('*')
    return <Page UI={data} />
}
```

**Padrão Exigido ✅ (RSC Streaming)**
```tsx
// ✅ Envia a "casca/shell visual" no milissegundo 0. Delega a carga pesada pra o Suspense:
import { Suspense } from 'react'

export default async function FastPage() {
    return (
        <div>
            <h1>Header Instantâneo</h1>
            <Suspense fallback={<Spinner />}>
               <DataFetcher />
            </Suspense>
        </div>
    )
}

async function DataFetcher() {
    const { data } = await supabase.from('users').select('*')
    return <Page UI={data} />
}
```

## 2. Abas e Links de Alta Prioridade (Dock/Navbar)
No ecossistema mobile, usuários operam com "Toques" sem um estado prévio de "Hover", o que anula os gatilhos convencionais de Next.js Prefetch padrão da Vercel.

- Elementos mestres da Navbar/Dockbar DEVEM obrigar a diretiva explícita `prefetch={true}` para instigar o celuluar do médico a guardar o esqueleto da próxima rota imediatamente no cache ram invisível, para renderização em tempo nulo.

### Código de Exemplo
```tsx
<Link 
   href="/rota" 
   prefetch={true} // Força pre-caching agresivo background
   onPointerDown={...}
>
    Ir instantaneamente
</Link>
```

## 3. Gestão e Animação de Layouts
A Vercel e seus `Analytics/SpeedInsights` nunca devem estar sob o controle dinâmico da biblioteca `framer-motion` (`AnimatePresence`).
A árvore de métricas Vercel é severamente interrompida pelo unmount dinâmico de layouts Clients.

**Diretriz**: `<Analytics />` e `<SpeedInsights />` sempre estarão cravados de forma pura e estática na raíz principal (`app/layout.tsx` Server-side).

---
*Escrito pela Antigravity AI em processo de otimização mobile intensiva do ProntuVet - Abril de 2026*
