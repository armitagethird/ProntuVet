# 🐾 ProntuVet

> Copiloto clínico com IA para médicos-veterinários. Transforma a conversa da consulta em um prontuário estruturado, completo e pronto para revisão — em segundos.

**Demo ao vivo →** [clinic-scribe-ai-1-1.vercel.app](https://clinic-scribe-ai-1-1.vercel.app)

---

## O problema

Veterinários gastam entre 30% e 40% do tempo de trabalho em documentação — preenchendo prontuários, redigindo receitas e organizando registros clínicos. Esse tempo roubado do atendimento gera burnout, erros de registro e queda na qualidade do cuidado com o animal.

O ProntuVet resolve isso.

---

## O que é

O ProntuVet é uma aplicação web que age como um **copiloto clínico**: durante a consulta, o veterinário conduz o atendimento normalmente enquanto o sistema escuta, transcreve e estrutura automaticamente um prontuário completo. Ao final, o profissional revisa, ajusta se necessário e confirma — sem digitar do zero.

A proposta não é ser um gravador ou um simples transcritor. É ser um auxiliador inteligente que entende o contexto da medicina veterinária e organiza as informações de forma clínica e padronizada.

---

## Funcionalidades

- **Escuta em tempo real** — captura o áudio da consulta diretamente no navegador
- **Transcrição automática** — converte fala em texto com reconhecimento específico para terminologia veterinária
- **Geração de prontuário estruturado** — organiza as informações em anamnese, exame físico, hipóteses diagnósticas, plano terapêutico e orientações ao tutor
- **Templates personalizáveis** — cada clínica ou profissional pode adaptar o modelo de prontuário à sua realidade
- **Resumo para o tutor** — gera uma versão em linguagem acessível para enviar ao responsável pelo animal
- **Interface limpa e rápida** — pensada para não atrapalhar o fluxo do atendimento

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| UI | React + shadcn/ui + Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (Google OAuth) |
| Backend serverless | Supabase Edge Functions |
| IA — Transcrição | OpenAI Whisper API |
| IA — Estruturação | OpenAI GPT-4o (em migração para Gemini 2.5 Flash) |
| Deploy | Vercel |
| Editor de código | Monaco Editor |

---

## Arquitetura resumida

```
Navegador (Next.js)
    │
    ├── Captura de áudio (Web Audio API)
    │       └── Whisper API → transcrição em texto
    │
    ├── Geração de prontuário (LLM via prompt engineering)
    │       └── GPT-4o / Gemini 2.5 Flash
    │
    └── Supabase
            ├── PostgreSQL (pacientes, prontuários, templates)
            ├── Auth (Google OAuth)
            └── Edge Functions (handlers de API protegidos)
```

O processamento de IA acontece server-side via Edge Functions — as chaves de API nunca são expostas ao cliente.

---

## Rodando localmente

```bash
# Clone o repositório
git clone https://github.com/armitagethird/ProntuVet.git
cd ProntuVet

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha com suas chaves: Supabase URL, Supabase Anon Key, OpenAI API Key

# Suba o banco de dados
# Execute database_schema.sql e setup_templates.sql no seu projeto Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

---

## Variáveis de ambiente necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

> ⚠️ Nunca commite o arquivo `.env.local`. Ele já está no `.gitignore`.

---

## Roadmap

- [x] Escuta e transcrição da consulta
- [x] Geração automática de prontuário estruturado
- [x] Templates personalizáveis por clínica
- [x] Resumo em linguagem acessível para o tutor
- [ ] Migração para Gemini 2.5 Flash (redução de custo ~87%)
- [ ] Histórico de consultas por animal
- [ ] Busca inteligente em prontuários anteriores
- [ ] Integração com WhatsApp para envio do resumo ao tutor
- [ ] Múltiplos profissionais por clínica (plano Clínica)
- [ ] Relatórios e dashboards de uso
- [ ] Integração com sistema de pagamento recorrente (Asaas)
- [ ] App mobile (PWA)

---

## Sobre o autor

**Romero Santos Saraiva** — [armitagethird](https://github.com/armitagethird)

Desenvolvedor baseado em São Luís, MA. Especialista em ServiceNow com foco em automação de processos e desenvolvimento de plataforma. Constrói produtos com IA aplicada a problemas reais — o ProntuVet nasceu da observação direta de como a burocracia documental afasta veterinários do que importa: cuidar dos animais.

- 🌐 Portfolio: [romerosaraiva.com](https://romerosaraiva.com)
- 💼 LinkedIn: [linkedin.com/in/romero-saraiva](https://linkedin.com/in/romero-saraiva)
- 🐙 GitHub: [github.com/armitagethird](https://github.com/armitagethird)
- 📋 ServiceNow Resume: [learning.servicenow.com](https://learning.servicenow.com/lxp?id=nl_public&user=romerosara016879)

**Certificações relevantes**
- ServiceNow Certified System Administrator (Associate)
- Flow Designer — Now University
- EF SET English C2 (nível máximo)
- Formação Engenheiro de Agentes de IA — Asimov Academy

---

## Licença

MIT — use, estude, adapte e contribua.

Sugestões, issues e pull requests são bem-vindos. Se este projeto te ajudou ou te inspirou, deixa uma ⭐ no repositório.

---

> ⚠️ Em desenvolvimento ativo. A aplicação está em fase de validação com clínicas veterinárias reais. Feedback é sempre bem-vindo.
