-- Drop the old functions
drop function if exists create_type_filter(uuid, text);
drop function if exists filter_by_prefixes(uuid, text[]);

-- Create the new consolidated function
create or replace function filter_by_prefixes(
  current_user_id uuid,
  prefix_type text,
  prefix_values text[]
) returns table (
  id uuid,
  content text,
  created_at timestamp with time zone,
  user_id uuid,
  entry_prefixes jsonb
) language plpgsql security definer as $$
begin
  return query
  select 
    e.id,
    e.content,
    e.created_at,
    e.user_id,
    (
      select jsonb_agg(
        jsonb_build_object(
          'prefix', jsonb_build_object(
            'id', p.id,
            'type', p.type,
            'value', p.value
          )
        )
      )
      from entry_prefixes ep
      join prefixes p on p.id = ep.prefix_id
      where ep.entry_id = e.id
    ) as entry_prefixes
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
  order by e.created_at desc;
end;
$$; 