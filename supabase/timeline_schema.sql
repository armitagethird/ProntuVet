-- Adicionar coluna para resumo da trilha clínica (IA)
ALTER TABLE public.consultations
ADD COLUMN IF NOT EXISTS resumo_trilha TEXT;

-- Comentário: Este campo será preenchido pela IA durante o processamento da consulta
-- para alimentar a visualização de linha do tempo (Timeline/Trilha).
