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

---
*Última atualização: 2026-04-06*
