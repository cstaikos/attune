-- Resolve open reports atomically when their content is hidden.
begin;
create or replace function public.moderate(action text,target text,target_id uuid,reason text) returns void language plpgsql security definer set search_path='' as $$
declare old_state jsonb; new_state jsonb; report_row public.private_reports%rowtype;
begin
 -- Serialize permission changes and actions so revocation cannot race an admin action.
 perform pg_advisory_xact_lock(609140003);
 if not private.is_admin() then raise exception 'Administrator permission required' using errcode='42501'; end if;
 if reason is null or length(btrim(reason)) not between 1 and 2000 then raise exception 'Provide a reason of 1–2000 characters'; end if;
 if target='member' and action in ('suspend','unsuspend','grant_admin','revoke_admin') then
   if target_id=auth.uid() then raise exception 'You cannot change your own access'; end if;
   select to_jsonb(m) into old_state from private.memberships m where user_id=target_id for update;
   update private.memberships set status=case action when 'suspend' then 'suspended' when 'unsuspend' then 'active' else status end,
    role=case action when 'grant_admin' then 'admin' when 'revoke_admin' then 'member' else role end where user_id=target_id returning to_jsonb(memberships) into new_state;
 elsif target='report' and action in ('resolve','dismiss') then
   select to_jsonb(r) into old_state from public.private_reports r where id=moderate.target_id for update;
   if old_state->>'status' <> 'open' then raise exception 'Report already closed'; end if;
   update public.private_reports set status=case action when 'resolve' then 'resolved' else 'dismissed' end where id=moderate.target_id returning to_jsonb(private_reports) into new_state;
 elsif target='playlist' and action in ('hide','restore') then
   select jsonb_build_object('hidden',hidden) into old_state from public.playlists where id=moderate.target_id for update;
   update public.playlists set hidden=(action='hide') where id=moderate.target_id returning jsonb_build_object('hidden',hidden) into new_state;
 elsif target='comment' and action in ('hide','restore') then
   select jsonb_build_object('hidden',hidden) into old_state from public.playlist_comments where id=moderate.target_id for update;
   update public.playlist_comments set hidden=(action='hide') where id=moderate.target_id returning jsonb_build_object('hidden',hidden) into new_state;
 else raise exception 'Invalid moderation action'; end if;
 if old_state is null or new_state is null then raise exception 'Target not found'; end if;
 insert into public.moderation_audit(actor_id,action,target_type,target_id,reason,before_state,after_state) values(auth.uid(),action,target,target_id,btrim(reason),old_state,new_state);
 if action='hide' and target in ('playlist','comment') then
   for report_row in select r.* from public.private_reports r
     where r.target_type=moderate.target and r.target_id=moderate.target_id and r.status='open' for update
   loop
     update public.private_reports set status='resolved' where id=report_row.id;
     insert into public.moderation_audit(actor_id,action,target_type,target_id,reason,before_state,after_state)
       values(auth.uid(),'resolve','report',report_row.id,btrim(reason),
         to_jsonb(report_row),to_jsonb(report_row) || '{"status":"resolved"}'::jsonb);
   end loop;
 end if;
end; $$;
commit;
