-- Drop existing function first
drop function if exists filter_by_prefixes(uuid, text[]);

-- Function to filter entries by prefix values
create or replace function filter_by_prefixes(
  current_user_id uuid,
  prefix_values text[]
) returns table (
  id uuid,
  content text,
  created_at timestamp with time zone,
  user_id uuid,
  entry_prefixes jsonb
) language plpgsql security definer as $$
declare
  temp_table_exists boolean;
begin
  -- Check if the temporary table exists
  select exists (
    select from information_schema.tables 
    where table_name = 'temp_type_filtered_entries'
  ) into temp_table_exists;

  -- If no prefix values provided, return entries from the appropriate source
  if array_length(prefix_values, 1) is null then
    if temp_table_exists then
      -- Return all entries from the temporary table (type filtered)
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
      from temp_type_filtered_entries e
      where e.user_id = current_user_id
      order by e.created_at desc;
    else
      -- Return all entries for the user
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
      where e.user_id = current_user_id
      order by e.created_at desc;
    end if;
  else
    -- Filter entries by prefix values
    if temp_table_exists then
      -- Filter entries from the temporary table (type filtered)
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
      from temp_type_filtered_entries e
      where e.user_id = current_user_id
      and (
        -- Ensure the entry has at least one prefix for each of the selected values
        select bool_and(
          exists (
            select 1
            from entry_prefixes ep
            join prefixes p on p.id = ep.prefix_id
            where ep.entry_id = e.id
            and p.value = v
          )
        )
        from unnest(prefix_values) as v
      )
      order by e.created_at desc;
    else
      -- Filter all entries for the user
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
      where e.user_id = current_user_id
      and (
        -- Ensure the entry has at least one prefix for each of the selected values
        select bool_and(
          exists (
            select 1
            from entry_prefixes ep
            join prefixes p on p.id = ep.prefix_id
            where ep.entry_id = e.id
            and p.value = v
          )
        )
        from unnest(prefix_values) as v
      )
      order by e.created_at desc;
    end if;
  end if;
end;
$$; 