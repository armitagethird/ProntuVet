-- SQL Script para configuração de Segurança (RLS) - ProntuVet
-- Instruções: Copie e cole este script no SQL Editor do seu painel Supabase e execute.

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_templates ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para a tabela 'animals'
-- Somente o dono do registro pode ver seus animais
CREATE POLICY "Users can only see their own animals" 
ON animals FOR SELECT 
USING (auth.uid() = user_id);

-- Somente o dono do registro pode inserir animais
CREATE POLICY "Users can only insert their own animals" 
ON animals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Somente o dono do registro pode atualizar seus animais
CREATE POLICY "Users can only update their own animals" 
ON animals FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Somente o dono do registro pode deletar seus animais
CREATE POLICY "Users can only delete their own animals" 
ON animals FOR DELETE 
USING (auth.uid() = user_id);


-- 3. Políticas para a tabela 'consultations'
CREATE POLICY "Users can only see their own consultations" 
ON consultations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own consultations" 
ON consultations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own consultations" 
ON consultations FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own consultations" 
ON consultations FOR DELETE 
USING (auth.uid() = user_id);


-- 4. Políticas para a tabela 'consultation_templates'
-- Usuário só acessa seus próprios modelos
CREATE POLICY "Users can manage their own templates" 
ON consultation_templates FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Segurança Extra: Restringir acesso a buckets de Storage (se existirem)
-- Certifique-se de que os buckets de áudio não sejam públicos.
