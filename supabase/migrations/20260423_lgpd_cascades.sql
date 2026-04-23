-- Cascata de exclusão para garantir o direito de eliminação (Art. 18 LGPD).
-- Ao apagar o auth.users, todas as tabelas dependentes devem cair junto.

-- consultations
ALTER TABLE public.consultations
  DROP CONSTRAINT IF EXISTS consultations_user_id_fkey,
  ADD CONSTRAINT consultations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- animals
ALTER TABLE public.animals
  DROP CONSTRAINT IF EXISTS animals_user_id_fkey,
  ADD CONSTRAINT animals_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- uso_consultas (garante que user_id existe + cascade)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'uso_consultas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.uso_consultas
      DROP CONSTRAINT IF EXISTS uso_consultas_user_id_fkey;
    ALTER TABLE public.uso_consultas
      ADD CONSTRAINT uso_consultas_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- anexos_consulta
ALTER TABLE public.anexos_consulta
  DROP CONSTRAINT IF EXISTS anexos_consulta_user_id_fkey,
  ADD CONSTRAINT anexos_consulta_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- consultation_templates (se existir user_id como FK)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'consultation_templates' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.consultation_templates
      DROP CONSTRAINT IF EXISTS consultation_templates_user_id_fkey;
    ALTER TABLE public.consultation_templates
      ADD CONSTRAINT consultation_templates_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
