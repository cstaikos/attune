begin;
-- The editor uses indexed keys so multiple links from one provider survive.
-- Continue accepting provider keys used by existing playlists.
create or replace function private.valid_playlist_links(value jsonb) returns boolean
language sql immutable set search_path = '' as $$
 select case when jsonb_typeof(value) <> 'object' then false else
   value <> '{}'::jsonb and not exists (
     select 1 from jsonb_each(value) e
     where (e.key not in ('spotify','youtube','apple','other') and e.key !~ '^url[0-9]+$')
     or jsonb_typeof(e.value) <> 'string' or length(e.value #>> '{}') > 2048
     or (e.value #>> '{}') !~ '^https?://[^[:space:]/?#]+[^[:space:]]*$'
   ) end;
$$;
commit;
