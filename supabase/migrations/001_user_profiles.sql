-- Create user_profiles table
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  bio text,
  avatar_url text,
  interests text[] default '{}',
  custom_interests text[] default '{}',
  district text,
  postal_code text,
  city text,
  age integer,
  languages text[] default '{}',
  lat double precision,
  lng double precision,
  activities_count integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table user_profiles enable row level security;

-- Everyone can read profiles (needed for activity feed later)
create policy "Profiles are publicly readable"
  on user_profiles for select
  using (true);

-- Users can only create their own profile
create policy "Users can insert their own profile"
  on user_profiles for insert
  with check (auth.uid() = user_id);

-- Users can only update their own profile
create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = user_id);

-- Auto-update updated_at on every change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();

-- Storage bucket for profile avatars (public read)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can view avatars
create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload into their own folder (avatars/{user_id}/...)
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
