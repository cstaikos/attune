-- Community schema. Supabase Auth owns credentials; membership is server controlled.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
create extension if not exists pgcrypto with schema extensions;

create type public.modality as enum ('MDMA','Psilocybin','Ketamine','Cannabis','Breathwork','Meditation');
create type public.music_tag as enum ('ambient','acoustic','electronic','classical','percussive','nature sounds','no vocals','wordless vocals','sung lyrics','spoken word','spacious','gentle','warm','reflective','uplifting','melancholic','tense','driving');
create type public.listening_label as enum ('abrupt transitions','sudden loud sounds','sustained high intensity','harsh or dissonant sounds','distressing human sounds','explicit language','religious or devotional content','death or grief themes','violence or abuse themes','sexual content');

-- RESTRICT is intentional until account deletion/retention has been designed.
create table private.memberships (
  user_id uuid primary key references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active','suspended')),
  role text not null default 'member' check (role in ('member','admin')),
  invites_remaining integer not null default 3 check (invites_remaining >= 0),
  created_at timestamptz not null default now()
);
alter table private.memberships enable row level security;

create function private.is_active_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.memberships m join auth.users u on u.id=m.user_id
    where m.user_id=(select auth.uid()) and m.status='active' and u.email_confirmed_at is not null);
$$;
revoke all on function private.is_active_member() from public, anon;
grant execute on function private.is_active_member() to authenticated;

create table public.profiles (
  id uuid primary key references private.memberships(user_id) on delete restrict,
  username text not null unique check (username ~ '^[a-z0-9-]{3,30}$'),
  display_name text not null check (length(btrim(display_name)) between 1 and 100),
  practice text not null default '' check (length(practice)<=200),
  location text not null default '' check (length(location)<=200),
  bio text not null default '' check (length(bio)<=5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function private.valid_playlist_links(value jsonb) returns boolean
language sql immutable set search_path = '' as $$
 select case when jsonb_typeof(value) <> 'object' then false else
   value <> '{}'::jsonb and not exists (
     select 1 from jsonb_each(value) e where e.key not in ('spotify','youtube','apple','other')
     or jsonb_typeof(e.value) <> 'string' or length(e.value #>> '{}') > 2048
     or (e.value #>> '{}') !~ '^https?://[^[:space:]/?#]+[^[:space:]]*$'
   ) end;
$$;
create function private.valid_tracks(value jsonb) returns boolean
language sql immutable set search_path = '' as $$
 select case when jsonb_typeof(value) <> 'array' then false else
   jsonb_array_length(value)<=1000 and not exists (
     select 1 from jsonb_array_elements(value) e where jsonb_typeof(e) <> 'object'
     or not (e ? 'title' and e ? 'artist')
     or jsonb_typeof(e->'title') <> 'string' or jsonb_typeof(e->'artist') <> 'string'
     or length(e->>'title')>500 or length(e->>'artist')>500
   ) end;
$$;
revoke all on function private.valid_playlist_links(jsonb), private.valid_tracks(jsonb) from public, anon;
grant execute on function private.valid_playlist_links(jsonb), private.valid_tracks(jsonb) to authenticated;

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 200),
  modality public.modality not null,
  duration_minutes integer not null check (duration_minutes > 0),
  energy_curve smallint[] not null check (array_ndims(energy_curve)=1 and cardinality(energy_curve) between 2 and 24 and energy_curve <@ array[1,2,3,4,5]::smallint[] and array_position(energy_curve,null) is null),
  qualities public.music_tag[] not null check (array_ndims(qualities)=1 and cardinality(qualities) between 1 and 18 and array_position(qualities,null) is null and not ('no vocals'=any(qualities) and qualities && array['wordless vocals','sung lyrics','spoken word']::public.music_tag[])),
  listening_reviewed boolean not null default false,
  listening_context text not null default '' check (length(listening_context)<=1000),
  notes text not null default '' check (length(notes)<=20000),
  links jsonb not null check (private.valid_playlist_links(links)),
  tracks jsonb not null default '[]' check (private.valid_tracks(tracks)),
  cover_a text not null default '#64765b' check (cover_a ~ '^#[0-9a-fA-F]{6}$'),
  cover_b text not null default '#e6b56a' check (cover_b ~ '^#[0-9a-fA-F]{6}$'),
  taxonomy_version smallint not null default 1 check (taxonomy_version=1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index playlists_creator_idx on public.playlists(creator_id);
create index playlists_created_idx on public.playlists(created_at desc, id);
create index playlists_modality_duration_idx on public.playlists(modality,duration_minutes);
create index playlists_qualities_idx on public.playlists using gin(qualities);

create table public.playlist_comments (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  body text not null check (length(btrim(body)) between 1 and 5000),
  warning boolean not null default false,
  created_at timestamptz not null default now()
);
create index playlist_comments_playlist_idx on public.playlist_comments(playlist_id,created_at);
create index playlist_comments_user_idx on public.playlist_comments(user_id);

-- Creator labels and community observations share one row per member/label.
-- Creator warning labels are derived by matching user_id with the playlist creator.
create table public.listening_reports (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  label public.listening_label not null,
  context text not null default '' check (length(context)<=1000),
  created_at timestamptz not null default now(),
  primary key (playlist_id,user_id,label)
);
create index listening_reports_user_idx on public.listening_reports(user_id);
create table public.saved_playlists (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,playlist_id)
);
create index saved_playlists_playlist_idx on public.saved_playlists(playlist_id);
create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  followed_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (follower_id,followed_id), check (follower_id<>followed_id)
);
create index follows_followed_idx on public.follows(followed_id);

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end $$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger playlists_updated before update on public.playlists for each row execute function private.touch_updated_at();
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
alter table public.playlists enable row level security;
revoke all on public.playlists from public, anon, authenticated;
grant select on public.playlists to authenticated;
alter table public.playlist_comments enable row level security;
revoke all on public.playlist_comments from public, anon, authenticated;
grant select on public.playlist_comments to authenticated;
alter table public.listening_reports enable row level security;
revoke all on public.listening_reports from public, anon, authenticated;
grant select on public.listening_reports to authenticated;
alter table public.saved_playlists enable row level security;
revoke all on public.saved_playlists from public, anon, authenticated;
grant select on public.saved_playlists to authenticated;
alter table public.follows enable row level security;
revoke all on public.follows from public, anon, authenticated;
grant select on public.follows to authenticated;
create policy member_read on public.profiles for select to authenticated using ((select private.is_active_member()));
create policy member_read on public.playlists for select to authenticated using ((select private.is_active_member()));
create policy member_read on public.playlist_comments for select to authenticated using ((select private.is_active_member()));
create policy member_read on public.listening_reports for select to authenticated using ((select private.is_active_member()));
grant insert (title,modality,duration_minutes,energy_curve,qualities,listening_reviewed,listening_context,notes,links,tracks,cover_a,cover_b) on public.playlists to authenticated;
create policy own_insert on public.playlists for insert to authenticated with check ((select private.is_active_member()) and creator_id=(select auth.uid()));
grant update (title,modality,duration_minutes,energy_curve,qualities,listening_reviewed,listening_context,notes,links,tracks,cover_a,cover_b) on public.playlists to authenticated;
create policy own_update on public.playlists for update to authenticated using ((select private.is_active_member()) and creator_id=(select auth.uid())) with check ((select private.is_active_member()) and creator_id=(select auth.uid()));
grant delete on public.playlists to authenticated;
create policy own_delete on public.playlists for delete to authenticated using ((select private.is_active_member()) and creator_id=(select auth.uid()));
grant insert (playlist_id,body,warning) on public.playlist_comments to authenticated;
create policy own_insert on public.playlist_comments for insert to authenticated with check ((select private.is_active_member()) and user_id=(select auth.uid()));
grant insert (playlist_id,label,context) on public.listening_reports to authenticated;
create policy own_insert on public.listening_reports for insert to authenticated with check ((select private.is_active_member()) and user_id=(select auth.uid()));
grant update (context) on public.listening_reports to authenticated;
create policy own_update on public.listening_reports for update to authenticated using ((select private.is_active_member()) and user_id=(select auth.uid())) with check ((select private.is_active_member()) and user_id=(select auth.uid()));
grant delete on public.listening_reports to authenticated;
create policy own_delete on public.listening_reports for delete to authenticated using ((select private.is_active_member()) and user_id=(select auth.uid()));
grant insert (playlist_id) on public.saved_playlists to authenticated;
create policy own_insert on public.saved_playlists for insert to authenticated with check ((select private.is_active_member()) and user_id=(select auth.uid()));
grant delete on public.saved_playlists to authenticated;
create policy own_delete on public.saved_playlists for delete to authenticated using ((select private.is_active_member()) and user_id=(select auth.uid()));
create policy own_read on public.saved_playlists for select to authenticated using ((select private.is_active_member()) and user_id=(select auth.uid()));
grant insert (followed_id) on public.follows to authenticated;
create policy own_insert on public.follows for insert to authenticated with check ((select private.is_active_member()) and follower_id=(select auth.uid()));
grant delete on public.follows to authenticated;
create policy own_delete on public.follows for delete to authenticated using ((select private.is_active_member()) and follower_id=(select auth.uid()));
create policy own_read on public.follows for select to authenticated using ((select private.is_active_member()) and follower_id=(select auth.uid()));
grant update (display_name,practice,location,bio) on public.profiles to authenticated;
create policy own_update on public.profiles for update to authenticated
 using ((select private.is_active_member()) and id=(select auth.uid()))
 with check ((select private.is_active_member()) and id=(select auth.uid()));

create table private.invitations (
 id uuid primary key default gen_random_uuid(),
 token_hash bytea not null unique,
 created_by uuid references public.profiles(id) on delete restrict,
 redeemed_by uuid unique references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '14 days'),
 redeemed_at timestamptz,
 check ((redeemed_by is null) = (redeemed_at is null))
);
alter table private.invitations enable row level security;
create index invitations_creator_idx on private.invitations(created_by);

-- Only the creating member receives the raw token, once. Concurrent calls lock
-- the membership row before consuming the invitation allowance.
create function public.create_invitation() returns table(id uuid,code text,expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare token text; invitation private.invitations;
begin
 if not private.is_active_member() then raise exception 'Active membership required' using errcode='42501'; end if;
 update private.memberships set invites_remaining=invites_remaining-1
 where user_id=auth.uid() and status='active' and invites_remaining>0;
 if not found then raise exception 'No invitations remaining' using errcode='42501'; end if;
 token=encode(extensions.gen_random_bytes(32),'hex');
 insert into private.invitations(token_hash,created_by) values (extensions.digest(token,'sha256'),auth.uid()) returning * into invitation;
 return query select invitation.id,token,invitation.expires_at;
end $$;

-- Sign up and verify email with Supabase Auth first, then redeem to gain access.
-- No JWT user_metadata value can grant membership, roles, or invitation credits.
create function public.redeem_invitation(code text, username text, display_name text default null, practice text default '') returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare actor uuid=auth.uid(); invitation private.invitations; profile public.profiles;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
 -- Lock the Auth user so simultaneous redemptions for the same account serialize.
 perform 1 from auth.users where id=actor and email_confirmed_at is not null for update;
 if not found then raise exception 'Verified email required' using errcode='42501'; end if;
 if exists(select 1 from private.memberships where user_id=actor) then raise exception 'Already a member' using errcode='23505'; end if;
 select * into invitation from private.invitations i where i.token_hash=extensions.digest(btrim(code),'sha256') for update;
 if not found or invitation.redeemed_by is not null or invitation.expires_at<=now() then
  raise exception 'Invalid or expired invitation' using errcode='22023';
 end if;
 if invitation.created_by is not null and not exists(select 1 from private.memberships where user_id=invitation.created_by and status='active') then
  raise exception 'Invalid or expired invitation' using errcode='22023';
 end if;
 insert into private.memberships(user_id) values(actor);
 insert into public.profiles(id,username,display_name,practice)
 values(actor,lower(btrim(username)),coalesce(nullif(btrim(display_name),''),lower(btrim(username))),practice) returning * into profile;
 update private.invitations set redeemed_by=actor,redeemed_at=now() where id=invitation.id;
 return profile;
end $$;

create function public.my_invitations() returns table(id uuid,created_by uuid,redeemed_by uuid,expires_at timestamptz,created_at timestamptz)
language sql stable security definer set search_path = '' as $$
 select i.id,i.created_by,i.redeemed_by,i.expires_at,i.created_at from private.invitations i
 where private.is_active_member() and i.created_by=auth.uid() order by i.created_at desc;
$$;
create function public.my_membership() returns table(status text,role text,invites_remaining integer)
language sql stable security definer set search_path = '' as $$
 select m.status,m.role,m.invites_remaining from private.memberships m where m.user_id=auth.uid();
$$;
-- Aggregate counts do not disclose another member's saved/followed lists.
create function public.playlist_save_count(playlist_id uuid) returns bigint
language sql stable security definer set search_path = '' as $$
 select count(*) from public.saved_playlists s where private.is_active_member() and s.playlist_id=playlist_save_count.playlist_id;
$$;
create function public.profile_follower_count(profile_id uuid) returns bigint
language sql stable security definer set search_path = '' as $$
 select count(*) from public.follows f where private.is_active_member() and f.followed_id=profile_id;
$$;
revoke all on function public.create_invitation(), public.redeem_invitation(text,text,text,text), public.my_invitations(), public.my_membership(), public.playlist_save_count(uuid), public.profile_follower_count(uuid) from public,anon;
grant execute on function public.create_invitation(), public.redeem_invitation(text,text,text,text), public.my_invitations(), public.my_membership(), public.playlist_save_count(uuid), public.profile_follower_count(uuid) to authenticated;
-- Explicitly protect future objects in the private schema as well.
revoke all on all tables in schema private from public,anon,authenticated;
alter default privileges in schema private revoke all on tables from public,anon,authenticated;
alter default privileges in schema private revoke execute on functions from public,anon,authenticated;
commit;
