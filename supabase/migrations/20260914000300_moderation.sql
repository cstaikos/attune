begin;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active_member() and exists(select 1 from private.memberships where user_id=auth.uid() and role='admin');
$$;
revoke all on function private.is_admin() from public,anon;
grant execute on function private.is_admin() to authenticated;
alter table public.playlists add column hidden boolean not null default false;
alter table public.playlist_comments add column hidden boolean not null default false;
create table public.private_reports (
 id uuid primary key default extensions.gen_random_uuid(),
 reporter_id uuid not null references private.memberships(user_id),
 target_type text not null check(target_type in ('playlist','comment','profile')),
 target_id uuid not null,
 reason text not null check(length(btrim(reason)) between 1 and 2000),
 status text not null default 'open' check(status in ('open','resolved','dismissed')),
 created_at timestamptz not null default now()
);
create unique index one_open_report on public.private_reports(reporter_id,target_type,target_id) where status='open';
create table public.moderation_audit (
 id uuid primary key default extensions.gen_random_uuid(), actor_id uuid not null references private.memberships(user_id),
 action text not null, target_type text not null, target_id uuid not null,
 reason text not null, before_state jsonb not null, after_state jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.private_reports enable row level security;
alter table public.moderation_audit enable row level security;
revoke all on public.private_reports,public.moderation_audit from anon,authenticated;
grant select on public.private_reports,public.moderation_audit to authenticated;
create policy private_read on public.private_reports for select to authenticated using (private.is_active_member() and (reporter_id=auth.uid() or private.is_admin()));
create policy admin_read on public.moderation_audit for select to authenticated using (private.is_admin());
drop policy member_read on public.playlists;
create policy member_read on public.playlists for select to authenticated using (private.is_active_member() and (not hidden or private.is_admin()));
drop policy member_read on public.playlist_comments;
create policy member_read on public.playlist_comments for select to authenticated using (private.is_active_member() and (private.is_admin() or (not hidden and exists(select 1 from public.playlists p where p.id=playlist_id and not p.hidden))));
create function public.submit_private_report(target text,target_id uuid,reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active_member() then raise exception 'Active membership required' using errcode='42501'; end if;
 if not ((target='playlist' and exists(select 1 from public.playlists where id=target_id and not hidden)) or
 (target='comment' and exists(select 1 from public.playlist_comments c join public.playlists p on p.id=c.playlist_id where c.id=target_id and not c.hidden and not p.hidden)) or
 (target='profile' and exists(select 1 from public.profiles where id=target_id))) then raise exception 'Report target not found'; end if;
 insert into public.private_reports(reporter_id,target_type,target_id,reason) values(auth.uid(),target,target_id,btrim(reason));
end; $$;
create function public.admin_members() returns table(user_id uuid,username text,status text,role text) language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Administrator permission required' using errcode='42501'; end if;
 return query select m.user_id,p.username,m.status,m.role from private.memberships m join public.profiles p on p.id=m.user_id order by p.username;
end; $$;
create function public.moderate(action text,target text,target_id uuid,reason text) returns void language plpgsql security definer set search_path='' as $$
declare old_state jsonb; new_state jsonb;
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
   select to_jsonb(r) into old_state from public.private_reports r where id=target_id for update;
   if old_state->>'status' <> 'open' then raise exception 'Report already closed'; end if;
   update public.private_reports set status=case action when 'resolve' then 'resolved' else 'dismissed' end where id=target_id returning to_jsonb(private_reports) into new_state;
 elsif target='playlist' and action in ('hide','restore') then
   select jsonb_build_object('hidden',hidden) into old_state from public.playlists where id=target_id for update;
   update public.playlists set hidden=(action='hide') where id=target_id returning jsonb_build_object('hidden',hidden) into new_state;
 elsif target='comment' and action in ('hide','restore') then
   select jsonb_build_object('hidden',hidden) into old_state from public.playlist_comments where id=target_id for update;
   update public.playlist_comments set hidden=(action='hide') where id=target_id returning jsonb_build_object('hidden',hidden) into new_state;
 else raise exception 'Invalid moderation action'; end if;
 if old_state is null or new_state is null then raise exception 'Target not found'; end if;
 insert into public.moderation_audit(actor_id,action,target_type,target_id,reason,before_state,after_state) values(auth.uid(),action,target,target_id,btrim(reason),old_state,new_state);
end; $$;
revoke all on function public.submit_private_report(text,uuid,text),public.admin_members(),public.moderate(text,text,uuid,text) from public,anon;
grant execute on function public.submit_private_report(text,uuid,text),public.admin_members(),public.moderate(text,text,uuid,text) to authenticated;
commit;
