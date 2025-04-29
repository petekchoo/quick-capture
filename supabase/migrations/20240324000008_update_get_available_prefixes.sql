-- Drop existing function first
drop function if exists get_available_prefixes(uuid);

-- Function to get available prefixes based on the current filter state
create or replace function get_available_prefixes(
  current_user_id uuid,
  prefix_type text,
  prefix_values text[]
) returns table (
  id uuid,
  value text,
  type text,
  count bigint
) language plpgsql security definer as $$
begin
  return query
  with filtered_entries as (
    -- First get the entries that match our filters
    select distinct e.id
    from entries e
    where e.user_id = $1
    -- Type filter (if provided)
    and (
      $2 is null 
      or exists (
        select 1
        from entry_prefixes ep
        join prefixes p on p.id = ep.prefix_id
        where ep.entry_id = e.id
        and p.type = $2
      )
    )
    -- Prefix value filter (if provided)
    and (
      array_length($3, 1) is null 
      or (
        select bool_and(
          exists (
            select 1
            from entry_prefixes ep
            join prefixes p on p.id = ep.prefix_id
            where ep.entry_id = e.id
            and p.value = v
          )
        )
        from unnest($3) as v
      )
    )
  )
  -- Get all prefixes from the filtered entries and count their occurrences
  select 
    p.id,
    p.value,
    p.type,
    count(distinct e.id) as count
  from filtered_entries e
  join entry_prefixes ep on ep.entry_id = e.id
  join prefixes p on p.id = ep.prefix_id
  group by p.id, p.value, p.type
  order by p.type, p.value;
end;
$$; 