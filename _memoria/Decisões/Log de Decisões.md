# Log de Decisões

Registro de decisões técnicas e de produto importantes. Atualizar sempre que uma decisão relevante for tomada.

---

## 2026-04-02

### Usar GPT-4o-mini em vez de GPT-4
**Decisão**: Usar `gpt-4o-mini` para estruturação dos prontuários
**Motivo**: Custo muito menor para uso contínuo em produção. A qualidade é suficiente para o caso de uso atual.
**Trade-off**: Pode errar em consultas muito técnicas ou ambíguas. Revisão futura quando houver receita.

### Next.js 16 com App Router
**Decisão**: Usar App Router (não Pages Router)
**Motivo**: Padrão atual do Next.js, melhor suporte a Server Components e streaming.

### Supabase como BaaS
**Decisão**: Supabase para autenticação + banco
**Motivo**: PostgreSQL gerenciado com Auth integrado + RLS + SDK fácil. Evita implementar auth do zero.

### Middleware via proxy.ts
**Decisão**: Middleware de autenticação configurado no `proxy.ts` em vez do `middleware.ts` raiz
**Motivo**: Compatibilidade com Next.js 16 e evitar conflitos na definição de matcher.

---

## Template para novas decisões

```
### [Data] — [Título da decisão]
**Decisão**: O que foi decidido
**Motivo**: Por que foi decidido assim
**Trade-off**: O que foi sacrificado / revisão futura
```
