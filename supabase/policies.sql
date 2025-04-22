-- Drop existing policies if they exist (both old and new names)
drop policy if exists "Users can view their own entries" on entries;
drop policy if exists "Users can insert their own entries" on entries;
drop policy if exists "Users can update their own entries" on entries;
drop policy if exists "Users can delete their own entries" on entries;
drop policy if exists "Authenticated users can view their own entries" on entries;
drop policy if exists "Authenticated users can insert their own entries" on entries;
drop policy if exists "Authenticated users can update their own entries" on entries;
drop policy if exists "Authenticated users can delete their own entries" on entries;

drop policy if exists "Users can view their own prefixes" on prefixes;
drop policy if exists "Users can insert their own prefixes" on prefixes;
drop policy if exists "Users can update their own prefixes" on prefixes;
drop policy if exists "Users can delete their own prefixes" on prefixes;
drop policy if exists "Authenticated users can view their own prefixes" on prefixes;
drop policy if exists "Authenticated users can insert their own prefixes" on prefixes;
drop policy if exists "Authenticated users can update their own prefixes" on prefixes;
drop policy if exists "Authenticated users can delete their own prefixes" on prefixes;

drop policy if exists "Users can view their own entry_prefixes" on entry_prefixes;
drop policy if exists "Users can insert their own entry_prefixes" on entry_prefixes;
drop policy if exists "Users can delete their own entry_prefixes" on entry_prefixes;
drop policy if exists "Authenticated users can view their own entry_prefixes" on entry_prefixes;
drop policy if exists "Authenticated users can insert their own entry_prefixes" on entry_prefixes;
drop policy if exists "Authenticated users can delete their own entry_prefixes" on entry_prefixes;

drop policy if exists "Users can view their own time_frames" on time_frames;
drop policy if exists "Users can insert their own time_frames" on time_frames;
drop policy if exists "Users can update their own time_frames" on time_frames;
drop policy if exists "Users can delete their own time_frames" on time_frames;
drop policy if exists "Authenticated users can view their own time_frames" on time_frames;
drop policy if exists "Authenticated users can insert their own time_frames" on time_frames;
drop policy if exists "Authenticated users can update their own time_frames" on time_frames;
drop policy if exists "Authenticated users can delete their own time_frames" on time_frames;

drop policy if exists "Users can view their own entry_metadata" on entry_metadata;
drop policy if exists "Users can insert their own entry_metadata" on entry_metadata;
drop policy if exists "Users can update their own entry_metadata" on entry_metadata;
drop policy if exists "Users can delete their own entry_metadata" on entry_metadata;
drop policy if exists "Authenticated users can view their own entry_metadata" on entry_metadata;
drop policy if exists "Authenticated users can insert their own entry_metadata" on entry_metadata;
drop policy if exists "Authenticated users can update their own entry_metadata" on entry_metadata;
drop policy if exists "Authenticated users can delete their own entry_metadata" on entry_metadata;

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
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert their own entry_prefixes"
  on entry_prefixes for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete their own entry_prefixes"
  on entry_prefixes for delete
  using (auth.role() = 'authenticated');

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