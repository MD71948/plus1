-- Chat messages for activities
create table activity_messages (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  content text not null check (length(content) > 0 and length(content) <= 500),
  created_at timestamptz default now()
);

alter table activity_messages enable row level security;

-- Host and accepted participants can read messages
create policy "Members can read messages"
  on activity_messages for select
  using (
    auth.uid() = (select host_id from activities where id = activity_id)
    or
    exists (
      select 1 from activity_requests
      where activity_id = activity_messages.activity_id
        and user_id = auth.uid()
        and status = 'accepted'
    )
  );

-- Host and accepted participants can send messages
create policy "Members can send messages"
  on activity_messages for insert
  with check (
    auth.uid() = user_id
    and (
      auth.uid() = (select host_id from activities where id = activity_id)
      or
      exists (
        select 1 from activity_requests
        where activity_id = activity_messages.activity_id
          and user_id = auth.uid()
          and status = 'accepted'
      )
    )
  );

-- Enable realtime for this table
alter publication supabase_realtime add table activity_messages;
