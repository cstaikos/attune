-- Keep playlist edits and creator listening labels atomic when moving off mocks.
begin;
create function public.save_playlist(playlist_id uuid, draft jsonb, warning_labels public.listening_label[])
returns public.playlists language plpgsql security invoker set search_path = '' as $$
declare input public.playlists; saved public.playlists;
begin
 if not private.is_active_member() then raise exception 'Active membership required' using errcode='42501'; end if;
 if warning_labels is null or array_position(warning_labels,null) is not null then
   raise exception 'Invalid listening labels' using errcode='22023';
 end if;
 input=jsonb_populate_record(null::public.playlists,draft);
 if playlist_id is null then
   insert into public.playlists(title,modality,duration_minutes,energy_curve,qualities,listening_reviewed,listening_context,notes,links,tracks)
   values(input.title,input.modality,input.duration_minutes,input.energy_curve,input.qualities,input.listening_reviewed,input.listening_context,input.notes,input.links,input.tracks)
   returning * into saved;
 else
   update public.playlists p set title=input.title,modality=input.modality,duration_minutes=input.duration_minutes,
     energy_curve=input.energy_curve,qualities=input.qualities,listening_reviewed=input.listening_reviewed,
     listening_context=input.listening_context,notes=input.notes,links=input.links,tracks=input.tracks
   where p.id=playlist_id and p.creator_id=auth.uid() returning * into saved;
   if not found then raise exception 'Playlist not found or not owned by you' using errcode='42501'; end if;
 end if;
 delete from public.listening_reports r where r.playlist_id=saved.id and r.user_id=auth.uid() and not (r.label=any(warning_labels));
 insert into public.listening_reports(playlist_id,label,context)
 select saved.id,label,'' from (select distinct unnest(warning_labels) label) labels
 where not exists (select 1 from public.listening_reports r where r.playlist_id=saved.id and r.user_id=auth.uid() and r.label=labels.label);
 return saved;
end $$;
revoke all on function public.save_playlist(uuid,jsonb,public.listening_label[]) from public,anon;
grant execute on function public.save_playlist(uuid,jsonb,public.listening_label[]) to authenticated;
commit;
