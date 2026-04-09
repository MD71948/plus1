-- User blocking table
create table if not exists user_blocks (
  blocker_id uuid references auth.users(id) on delete cascade,
  blocked_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

alter table user_blocks enable row level security;

-- Users can only see and manage their own blocks
create policy "Users manage own blocks"
  on user_blocks for all
  using (auth.uid() = blocker_id);
