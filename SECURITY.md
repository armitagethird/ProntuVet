# 🛡️ Checklist de Segurança ProntuVet

Este arquivo serve como um guia vivo para garantir que novas funcionalidades do ProntuVet mantenham o padrão de segurança estabelecido.

## 📝 Ao criar novas Rotas de API (`/api/...`)
- [ ] **Validação com Zod**: Todo `request.json()` ou `request.formData()` deve ser validado com um schema Zod.
- [ ] **Autenticação**: Sempre use `await supabase.auth.getUser()` no início da consulta (não confie apenas no middleware).
- [ ] **Captura de Erros**: Use blocos `try/catch` e retorne mensagens genéricas em caso de erro 500 para evitar vazamento de dados internos.
- [ ] **Rate Limiting**: Se a rota consome recursos caros (como IA) ou envia e-mails, aplique limites de requisição.

## 🗄️ Ao criar novas Tabelas no Supabase
- [ ] **Habilitar RLS**: Execute `ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;`.
- [ ] **Criar Políticas (Policies)**: Defina quem pode ver/editar os dados (ex: `auth.uid() = user_id`).
- [ ] **Evitar Service Role**: Nunca use a `service_role_key` no front-end ou em hooks que não precisem de privilégios totais.

## 🤖 Ao trabalhar com IA (Gemini/OpenAI)
- [ ] **Isolamento de Input**: Sempre envolva o texto do usuário em delimitadores XML (ex: `<transcription>...` ou `"""..."""`) no prompt.
- [ ] **Instruções de Sistema**: Force a IA a ignorar instruções de sistema vindas de dentro do input do usuário.

## 📁 Ao lidar com Uploads
- [ ] **Validar Tamanho**: Limite o tamanho máximo do arquivo (ex: 25MB para áudio).
- [ ] **Validar Tipo MIME**: Verifique se o arquivo é realmente do tipo esperado (`audio/*`).

## 🛡️ Blindagem de Infraestrutura (Supabase Hardening)
- [x] **Funções SQL Seguras**: Todas as funções `SECURITY DEFINER` (como `handle_new_user`) possuem `search_path = public` fixo para evitar ataques de sequestro de caminho.
- [x] **Políticas de Storage Granulares**:
    - O bucket `avatars` possui leitura pública apenas para membros autenticados (ou visualização via URL assinada/pública se explicitamente permitido).
    - O bucket `medical-attachments` é **estritamente privado** e configurado com RLS que isola os dados por `auth.uid()`.
- [x] **RLS Mandatório**: Todas as tabelas no esquema `public` possuem Row Level Security (RLS) habilitado.

## 🔐 Autenticação Zero-Trust & Stack Estável (Core do Sistema)
- [x] **Middleware Global**: O arquivo de proteção principal **SEMPRE** deve residir na raiz do diretório `src/middleware.ts` para que o Next.js intercepte nativamente requisições a rotas privadas.
- [x] **Compatibilidade de Criptografia Base JWT (ES256 Bug)**: Para evitar o bug fatal de incompatibilidade local de assinaturas assimétricas `ES256` nos runtimes serverless Edge da Vercel e Deno, o ecossistema do ProntuVet deve **Obrigatoriamente Repousar nas Versões**:
    - `@supabase/supabase-js: ^2.45.6`
    - `@supabase/ssr: ^0.4.0`
- [x] **Framework Confiável**: Evite "Release Candidates" instáveis (como React 19 ou Next 15 com seu Turbopack não validado em nossa infra). A fundação do sistema foi cravada à solidez da stack Gold LTS: **Next.js 14.2.16** e **React 18.3.1**. Mantenha dessa forma para prevenir lentidões extremas em Dev ou crashes misteriosos em Produção.

---
*Última atualização: 2026-04-06*
