-- Function to analyze filter_by_prefixes performance
create or replace function analyze_filter_by_prefixes(
  current_user_id uuid,
  prefix_type text,
  prefix_values text[]
) returns table (
  plan text
) language plpgsql security definer as $$
begin
  return query
  explain analyze
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

-- Function to analyze get_available_prefixes performance
create or replace function analyze_get_available_prefixes(
  current_user_id uuid,
  prefix_type text,
  prefix_values text[]
) returns table (
  plan text
) language plpgsql security definer as $$
begin
  return query
  explain analyze
  select 
    p.id,
    p.value,
    p.type,
    count(distinct e.id) as count
  from prefixes p
  join entry_prefixes ep on ep.prefix_id = p.id
  join entries e on e.id = ep.entry_id
  where e.user_id = $1
  and (
    $2 is null 
    or p.type = $2
  )
  and (
    array_length($3, 1) is null 
    or (
      select bool_and(
        exists (
          select 1
          from entry_prefixes ep2
          join prefixes p2 on p2.id = ep2.prefix_id
          where ep2.entry_id = e.id
          and p2.value = v
        )
      )
      from unnest($3) as v
    )
  )
  group by p.id, p.value, p.type
  order by p.type, p.value;
end;
$$; 