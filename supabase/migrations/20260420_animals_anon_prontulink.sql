-- Permite anon ler animais vinculados a consultas com ProntuLink válido.
-- Sem isso o join `animals (name, species)` retorna null para tutores.
CREATE POLICY "Anon pode ler animal via prontulink"
  ON public.animals FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.animal_id = animals.id
        AND c.tutor_token IS NOT NULL
        AND c.tutor_token_expires_at > now()
        AND c.tutor_token_revoked_at IS NULL
    )
  );
