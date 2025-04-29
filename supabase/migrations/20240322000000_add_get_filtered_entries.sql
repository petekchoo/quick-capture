-- Drop existing function first
drop function if exists get_filtered_entries(uuid);

-- Function to get entries from the temporary type filter table
create or replace function get_filtered_entries(
  user_id uuid
) returns table (
  id uuid,
  content text,
  created_at timestamp with time zone,
  user_id uuid,
  entry_prefixes jsonb
) language plpgsql security definer as $$
begin
  -- Check if the temporary table exists
  if not exists (
    select from information_schema.tables 
    where table_name = 'temp_type_filtered_entries'
  ) then
    raise exception 'Temporary type filter table does not exist';
  end if;

  -- Return entries from the temporary table
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
  where e.user_id = $1
  order by e.created_at desc;
end;
$$; 