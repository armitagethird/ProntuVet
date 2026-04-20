-- Sessões ricas no ProntuLink: clínica, foto do animal e sessões clínicas estruturadas.
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS prontulink_clinic_name TEXT,
  ADD COLUMN IF NOT EXISTS prontulink_animal_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS prontulink_sessions JSONB DEFAULT '[]'::jsonb;
