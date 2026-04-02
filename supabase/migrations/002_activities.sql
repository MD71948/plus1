-- Create activities table
create table activities (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null,
  location_name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  date_time timestamptz not null,
  spots_total integer not null check (spots_total >= 1),
  spots_taken integer default 0 not null,
  status text default 'open' not null check (status in ('open', 'full', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table activities enable row level security;

-- Everyone can read open activities
create policy "Activities are publicly readable"
  on activities for select
  using (true);

-- Users can only create activities as themselves
create policy "Users can create activities"
  on activities for insert
  with check (auth.uid() = host_id);

-- Only the host can update/cancel their activity
create policy "Hosts can update their activities"
  on activities for update
  using (auth.uid() = host_id);

create policy "Hosts can delete their activities"
  on activities for delete
  using (auth.uid() = host_id);

-- Auto-update updated_at
create trigger update_activities_updated_at
  before update on activities
  for each row execute function update_updated_at();
