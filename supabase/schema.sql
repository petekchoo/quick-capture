-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create entries table
create table entries (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create prefixes table
create table prefixes (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('person', 'action', 'idea', 'tag')),
  value text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, type, value)
);

-- Create entry_prefixes junction table
create table entry_prefixes (
  entry_id uuid references entries(id) on delete cascade,
  prefix_id uuid references prefixes(id) on delete cascade,
  primary key (entry_id, prefix_id)
);

-- Create time_frames table
create table time_frames (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references entries(id) on delete cascade not null,
  start_time timestamp with time zone,
  end_time timestamp with time zone
);

-- Create metadata table
create table entry_metadata (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references entries(id) on delete cascade not null,
  source text,
  context text
);

-- Create indexes for better query performance
create index entries_user_id_idx on entries(user_id);
create index entries_created_at_idx on entries(created_at);
create index prefixes_user_id_idx on prefixes(user_id);
create index prefixes_type_value_idx on prefixes(type, value);
create index entry_prefixes_entry_id_idx on entry_prefixes(entry_id);
create index entry_prefixes_prefix_id_idx on entry_prefixes(prefix_id);
create index time_frames_entry_id_idx on time_frames(entry_id);
create index entry_metadata_entry_id_idx on entry_metadata(entry_id);

-- Set up Row Level Security (RLS)
alter table entries enable row level security;
alter table prefixes enable row level security;
alter table entry_prefixes enable row level security;
alter table time_frames enable row level security;
alter table entry_metadata enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own entries" on entries;
drop policy if exists "Users can insert their own entries" on entries;
drop policy if exists "Users can update their own entries" on entries;
drop policy if exists "Users can delete their own entries" on entries;

drop policy if exists "Users can view their own prefixes" on prefixes;
drop policy if exists "Users can insert their own prefixes" on prefixes;
drop policy if exists "Users can update their own prefixes" on prefixes;
drop policy if exists "Users can delete their own prefixes" on prefixes;

drop policy if exists "Users can view their own entry_prefixes" on entry_prefixes;
drop policy if exists "Users can insert their own entry_prefixes" on entry_prefixes;
drop policy if exists "Users can delete their own entry_prefixes" on entry_prefixes;

drop policy if exists "Users can view their own time_frames" on time_frames;
drop policy if exists "Users can insert their own time_frames" on time_frames;
drop policy if exists "Users can update their own time_frames" on time_frames;
drop policy if exists "Users can delete their own time_frames" on time_frames;

drop policy if exists "Users can view their own entry_metadata" on entry_metadata;
drop policy if exists "Users can insert their own entry_metadata" on entry_metadata;
drop policy if exists "Users can update their own entry_metadata" on entry_metadata;
drop policy if exists "Users can delete their own entry_metadata" on entry_metadata;

-- Entries table policies
create policy "Authenticated users can view their own entries"
  on entries for select
  using (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Authenticated users can insert their own entries"
  on entries for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Authenticated users can update their own entries"
  on entries for update
  using (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Authenticated users can delete their own entries"
  on entries for delete
  using (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Prefixes table policies
create policy "Authenticated users can view their own prefixes"
  on prefixes for select
  using (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Authenticated users can insert their own prefixes"
  on prefixes for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Authenticated users can update their own prefixes"
  on prefixes for update
  using (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Authenticated users can delete their own prefixes"
  on prefixes for delete
  using (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Entry_prefixes junction table policies
create policy "Authenticated users can view their own entry_prefixes"
  on entry_prefixes for select
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = entry_prefixes.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Authenticated users can insert their own entry_prefixes"
  on entry_prefixes for insert
  with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = entry_prefixes.entry_id
      and entries.user_id = auth.uid()
    )
    and
    exists (
      select 1 from prefixes
      where prefixes.id = entry_prefixes.prefix_id
      and prefixes.user_id = auth.uid()
    )
  );

create policy "Authenticated users can delete their own entry_prefixes"
  on entry_prefixes for delete
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = entry_prefixes.entry_id
      and entries.user_id = auth.uid()
    )
  );

-- Time_frames table policies
create policy "Authenticated users can view their own time_frames"
  on time_frames for select
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = time_frames.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Authenticated users can insert their own time_frames"
  on time_frames for insert
  with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = time_frames.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Authenticated users can update their own time_frames"
  on time_frames for update
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = time_frames.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Authenticated users can delete their own time_frames"
  on time_frames for delete
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = time_frames.entry_id
      and entries.user_id = auth.uid()
    )
  );

-- Entry_metadata table policies
create policy "Authenticated users can view their own entry_metadata"
  on entry_metadata for select
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = entry_metadata.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Authenticated users can insert their own entry_metadata"
  on entry_metadata for insert
  with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = entry_metadata.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Authenticated users can update their own entry_metadata"
  on entry_metadata for update
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = entry_metadata.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Authenticated users can delete their own entry_metadata"
  on entry_metadata for delete
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from entries
      where entries.id = entry_metadata.entry_id
      and entries.user_id = auth.uid()
    )
  ); 