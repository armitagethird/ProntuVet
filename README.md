<div align="center">

# 🐾 ProntuVet

**Copiloto clínico com IA para médicos-veterinários.**
Transforma a conversa da consulta em prontuário estruturado — em segundos.

[![MIT License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/status-em%20desenvolvimento%20ativo-f59e0b?style=flat-square)]()
[![Deploy](https://img.shields.io/badge/deploy-Vercel-000000?style=flat-square&logo=vercel)](https://clinic-scribe-ai-1-1.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-96%25-3178c6?style=flat-square&logo=typescript&logoColor=white)]()

**[→ Ver demo ao vivo](https://clinic-scribe-ai-1-1.vercel.app)**

</div>

---

## O problema

Veterinários gastam entre **30% e 40%** do tempo de trabalho em documentação — preenchendo prontuários, redigindo receitas e organizando registros clínicos. Esse tempo roubado do atendimento gera burnout, erros de registro e queda na qualidade do cuidado com o animal.

**O ProntuVet resolve isso.**

---

## O que é

O ProntuVet é uma aplicação web que age como um **copiloto clínico**: durante a consulta, o veterinário conduz o atendimento normalmente enquanto o sistema escuta, transcreve e estrutura automaticamente um prontuário completo. Ao final, o profissional revisa, ajusta se necessário e confirma — sem digitar do zero.

A proposta não é ser um gravador ou um simples transcritor. É ser um auxiliador inteligente que entende o contexto da medicina veterinária e organiza as informações de forma clínica e padronizada.

---

## Funcionalidades

- 🎙️ **Escuta em tempo real** — captura o áudio da consulta diretamente no navegador
- 📝 **Transcrição automática** — converte fala em texto com reconhecimento de terminologia veterinária
- 🧠 **Geração de prontuário estruturado** — organiza anamnese, exame físico, hipóteses diagnósticas, plano terapêutico e orientações ao tutor
- 🎨 **Templates personalizáveis** — cada clínica adapta o modelo à sua realidade
- 💬 **Resumo para o tutor** — gera versão em linguagem acessível para o responsável pelo animal
- ⚡ **Interface rápida e limpa** — pensada para não atrapalhar o fluxo do atendimento

---

## Stack

### Frontend

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

### Backend & Banco de Dados

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

### Inteligência Artificial

![OpenAI](https://img.shields.io/badge/OpenAI_Whisper-412991?style=for-the-badge&logo=openai&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

### Deploy & Ferramentas

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)

---

## Arquitetura

```
Navegador (Next.js)
    │
    ├── 🎙️ Captura de áudio (Web Audio API)
    │         └── Whisper API → transcrição em texto
    │
    ├── 🧠 Geração de prontuário (LLM via prompt engineering)
    │         └── Gemini 2.5 Flash
    │
    └── 🗄️ Supabase
              ├── PostgreSQL      (pacientes, prontuários, templates)
              ├── Auth            (Google OAuth)
              └── Edge Functions  (handlers de API protegidos)
```

> O processamento de IA acontece server-side via Edge Functions — as chaves de API nunca são expostas ao cliente.

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
# Preencha com suas chaves (veja seção abaixo)

# Suba o banco de dados
# Execute database_schema.sql e setup_templates.sql no seu projeto Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

---

## Variáveis de ambiente

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
- [ ] Migração completa para Gemini 2.5 Flash
- [ ] Histórico de consultas por animal
- [ ] Busca inteligente em prontuários anteriores
- [ ] Envio do resumo ao tutor via WhatsApp
- [ ] Múltiplos profissionais por clínica
- [ ] Relatórios e dashboards de uso
- [ ] Integração com pagamento recorrente (Asaas)
- [ ] App mobile (PWA)

---

## Sobre o autor

<div align="center">

**Romero Santos Saraiva** — `armitagethird`

Desenvolvedor baseado em São Luís, MA. Especialista em ServiceNow com foco em automação de processos e desenvolvimento de plataforma. Constrói produtos com IA aplicada a problemas reais — o ProntuVet nasceu da observação direta de como a burocracia documental afasta veterinários do que importa: cuidar dos animais.

[![Portfolio](https://img.shields.io/badge/Portfolio-romerosaraiva.com-000000?style=flat-square&logo=vercel&logoColor=white)](https://romerosaraiva.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-romero--saraiva-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/romero-saraiva)
[![GitHub](https://img.shields.io/badge/GitHub-armitagethird-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/armitagethird)
[![ServiceNow](https://img.shields.io/badge/ServiceNow_Resume-ver_perfil-00A1E0?style=flat-square&logo=servicenow&logoColor=white)](https://learning.servicenow.com/lxp?id=nl_public&user=romerosara016879)

</div>

### Certificações

| Certificação | Emissor |
|---|---|
| Associate System Administrator | ServiceNow / Now University |
| Flow Designer | ServiceNow / Now University |
| EF SET English C2 (nível máximo) | EF Education First |
| Formação Engenheiro de Agentes de IA | Asimov Academy |

---

## Licença

```
MIT License — use, estude, adapte e contribua livremente.
```

Se este projeto te ajudou ou te inspirou, deixa uma ⭐ no repositório — faz diferença.

---

<div align="center">

Desenvolvido com foco em **produtividade clínica**, **organização documental** e **experiência real de atendimento veterinário**.

🐶 🐱 🐰 🐦 🦎

</div>
