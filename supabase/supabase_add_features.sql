-- 1. Create the animals table
create table public.animals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  species text,
  breed text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on animals
alter table public.animals enable row level security;

-- Create policies for animals table
create policy "Users can view their own animals."
  on public.animals for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own animals."
  on public.animals for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own animals."
  on public.animals for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own animals."
  on public.animals for delete
  using ( auth.uid() = user_id );

-- Trigger to automatically update 'updated_at' on animals
create trigger handle_updated_at before update on public.animals
  for each row execute procedure moddatetime (updated_at);

-- 2. Add new columns to the existing consultations table
alter table public.consultations
add column if not exists animal_id uuid references public.animals(id) on delete set null,
add column if not exists tutor_name text,
add column if not exists tutor_summary text,
add column if not exists vet_summary text,
add column if not exists manual_notes text,
add column if not exists tags text[] default '{}';
