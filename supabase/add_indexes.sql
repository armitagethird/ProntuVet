-- ============================================================
-- Índices de Performance — ProntuVet
-- Arquivo: add_indexes.sql
-- Instrução: Execute este script no SQL Editor do Supabase.
-- ============================================================

-- 1. Índice composto para queries de rate limit e histórico
--    Usado em: process-consultation/route.ts (rate limit por dia/mês)
--    e em qualquer listagem/filtro por usuário ordenada por data
CREATE INDEX IF NOT EXISTS idx_consultations_user_created 
    ON consultations(user_id, created_at DESC);

-- 2. Índice para busca de animal por nome (case-insensitive via ilike)
--    Usado em: findOrCreateAnimal, /api/animals/search
CREATE INDEX IF NOT EXISTS idx_animals_user_name 
    ON animals(user_id, lower(name));

-- 3. Índice para o animal_id nas consultas (join de animais)
--    Usado em: /api/animals/[id]/history (busca por animal_id)
CREATE INDEX IF NOT EXISTS idx_consultations_animal_id
    ON consultations(animal_id)
    WHERE animal_id IS NOT NULL;

-- 4. Índice para busca de anexos por consulta
--    Usado em: DELETE de consulta (busca attachments antes de deletar)
CREATE INDEX IF NOT EXISTS idx_anexos_consulta_id
    ON anexos_consulta(consulta_id);

-- Verificar índices criados:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('consultations', 'animals', 'anexos_consulta');
