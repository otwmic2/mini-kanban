-- Drop the old tasks table and create new structure
drop table if exists public.tasks cascade;

-- Create boards table
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create lists table (columns in the board)
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create tasks table (cards in the lists)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title text not null,
  description text,
  priority text not null check (priority in ('low', 'medium', 'high')),
  position integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.boards enable row level security;
alter table public.lists enable row level security;
alter table public.tasks enable row level security;

-- RLS Policies for boards: Users can only see and manage their own boards
create policy "Users can view their own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- RLS Policies for lists: Users can manage lists in their own boards
create policy "Users can view lists in their boards"
  on public.lists for select
  using (
    exists (
      select 1 from public.boards
      where boards.id = lists.board_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can insert lists in their boards"
  on public.lists for insert
  with check (
    exists (
      select 1 from public.boards
      where boards.id = board_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can update lists in their boards"
  on public.lists for update
  using (
    exists (
      select 1 from public.boards
      where boards.id = lists.board_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete lists in their boards"
  on public.lists for delete
  using (
    exists (
      select 1 from public.boards
      where boards.id = lists.board_id
      and boards.user_id = auth.uid()
    )
  );

-- RLS Policies for tasks: Users can manage tasks in lists within their boards
create policy "Users can view tasks in their boards"
  on public.tasks for select
  using (
    exists (
      select 1 from public.lists
      join public.boards on boards.id = lists.board_id
      where lists.id = tasks.list_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can insert tasks in their boards"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.lists
      join public.boards on boards.id = lists.board_id
      where lists.id = list_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can update tasks in their boards"
  on public.tasks for update
  using (
    exists (
      select 1 from public.lists
      join public.boards on boards.id = lists.board_id
      where lists.id = tasks.list_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete tasks in their boards"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.lists
      join public.boards on boards.id = lists.board_id
      where lists.id = tasks.list_id
      and boards.user_id = auth.uid()
    )
  );

-- Create indexes for faster queries
create index if not exists boards_user_id_idx on public.boards(user_id);
create index if not exists lists_board_id_idx on public.lists(board_id);
create index if not exists tasks_list_id_idx on public.tasks(list_id);
create index if not exists tasks_priority_idx on public.tasks(priority);
