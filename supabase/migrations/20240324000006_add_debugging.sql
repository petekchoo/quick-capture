-- Drop existing function first
drop function if exists create_type_filter(uuid, text);

-- Function to create a temporary table for type filtering
create or replace function create_type_filter(
  user_id uuid,
  prefix_type text
) returns void
language plpgsql security definer as $$
declare
  entry_count integer;
  invalid_entries integer;
  table_exists boolean;
begin
  -- Check if table exists before dropping
  select exists (
    select from information_schema.tables 
    where table_name = 'temp_type_filtered_entries'
  ) into table_exists;
  
  if table_exists then
    raise notice 'Dropping existing temporary table';
    drop table temp_type_filtered_entries;
  end if;
  
  -- Create a new temporary table with entries that have the specified prefix type
  raise notice 'Creating temporary table for type %', prefix_type;
  create temporary table temp_type_filtered_entries as
  select distinct e.*
  from entries e
  where e.user_id = $1
  and exists (
    select 1
    from entry_prefixes ep
    join prefixes p on p.id = ep.prefix_id
    where ep.entry_id = e.id
    and p.type = $2
  );

  -- Log the number of entries in the temporary table
  select count(*) into entry_count from temp_type_filtered_entries;
  raise notice 'Created temporary table with % entries for type %', entry_count, $2;

  -- Verify that all entries in the temporary table have at least one prefix of the specified type
  select count(*) into invalid_entries
  from temp_type_filtered_entries e
  where not exists (
    select 1
    from entry_prefixes ep
    join prefixes p on p.id = ep.prefix_id
    where ep.entry_id = e.id
    and p.type = $2
  );

  if invalid_entries > 0 then
    raise exception 'Found % entries without the required prefix type %', invalid_entries, $2;
  end if;
end;
$$; 