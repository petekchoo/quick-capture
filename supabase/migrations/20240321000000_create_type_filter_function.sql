-- Drop existing functions first
drop function if exists create_type_filter(uuid, text);
drop function if exists get_available_prefixes(uuid);
drop function if exists verify_type_filter(uuid, text);

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

-- Function to drop the temporary table
create or replace function drop_type_filter()
returns void
language plpgsql security definer as $$
declare
  table_exists boolean;
begin
  -- Check if table exists before dropping
  select exists (
    select from information_schema.tables 
    where table_name = 'temp_type_filtered_entries'
  ) into table_exists;
  
  if table_exists then
    raise notice 'Dropping temporary table';
    drop table temp_type_filtered_entries;
  end if;
end;
$$;

-- Function to verify the temporary table contents
create or replace function verify_type_filter(
  user_id uuid,
  prefix_type text
) returns table (
  entry_id uuid,
  prefix_count integer,
  prefix_types text[]
) language plpgsql security definer as $$
begin
  return query
  select 
    e.id as entry_id,
    count(distinct p.id) as prefix_count,
    array_agg(distinct p.type) as prefix_types
  from temp_type_filtered_entries e
  join entry_prefixes ep on ep.entry_id = e.id
  join prefixes p on p.id = ep.prefix_id
  where e.user_id = $1
  group by e.id
  order by e.id;
end;
$$;

-- Function to get available prefixes for the current type filter
create or replace function get_available_prefixes(
  user_id uuid
) returns table (
  id uuid,
  value text,
  type text
) language plpgsql security definer as $$
declare
  temp_table_exists boolean;
begin
  -- Check if the temporary table exists
  select exists (
    select from information_schema.tables 
    where table_name = 'temp_type_filtered_entries'
  ) into temp_table_exists;

  if temp_table_exists then
    -- If temporary table exists, get all unique prefixes from filtered entries
    return query
    select distinct p.id, p.value, p.type
    from prefixes p
    join entry_prefixes ep on ep.prefix_id = p.id
    join temp_type_filtered_entries e on e.id = ep.entry_id
    where p.user_id = $1
    order by p.type, p.value;
  else
    -- If no temporary table, get all prefixes for the user
    return query
    select p.id, p.value, p.type
    from prefixes p
    where p.user_id = $1
    order by p.type, p.value;
  end if;
end;
$$; 