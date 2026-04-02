-- Create activity_requests table
create table activity_requests (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text default 'pending' not null check (status in ('pending', 'accepted', 'rejected')),
  message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(activity_id, user_id)
);

-- Enable RLS
alter table activity_requests enable row level security;

-- Host can see all requests for their activities
create policy "Hosts can view requests for their activities"
  on activity_requests for select
  using (
    auth.uid() = user_id
    or auth.uid() = (select host_id from activities where id = activity_id)
  );

-- Users can send a request (only once per activity)
create policy "Users can create requests"
  on activity_requests for insert
  with check (auth.uid() = user_id);

-- Host can update request status (accept/reject)
create policy "Hosts can update request status"
  on activity_requests for update
  using (
    auth.uid() = user_id
    or auth.uid() = (select host_id from activities where id = activity_id)
  );

-- Users can delete their own pending request (withdraw)
create policy "Users can delete their own request"
  on activity_requests for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create trigger update_activity_requests_updated_at
  before update on activity_requests
  for each row execute function update_updated_at();
