begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- Isolated fixtures; every change is rolled back at the end.
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-0000-0000-000000000001','alice@example.test',now()),
 ('10000000-0000-0000-0000-000000000002','bob@example.test',now()),
 ('10000000-0000-0000-0000-000000000003','new@example.test',now()),
 ('10000000-0000-0000-0000-000000000004','unverified@example.test',null),
 ('10000000-0000-0000-0000-000000000005','other@example.test',now());
insert into private.memberships(user_id) values
 ('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002');
insert into public.profiles(id,username,display_name) values
 ('10000000-0000-0000-0000-000000000001','alice','Alice'),
 ('10000000-0000-0000-0000-000000000002','bob','Bob');
insert into public.playlists(id,creator_id,title,modality,duration_minutes,energy_curve,qualities,links) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Alice playlist','Meditation',30,array[1,2]::smallint[],array['ambient']::music_tag[],'{"other":"https://example.com/music"}');
insert into private.invitations(token_hash,created_by,expires_at) values
 (extensions.digest('test-invite','sha256'),'10000000-0000-0000-0000-000000000001',now()+interval '1 day'),
 (extensions.digest('expired-invite','sha256'),'10000000-0000-0000-0000-000000000001',now()-interval '1 day');

select ok((select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r'),'All application tables enable RLS');
set local role anon;
select throws_ok('select * from public.playlists','42501',null,'Anonymous users cannot read playlists');
select throws_ok('select public.create_invitation()','42501',null,'Anonymous users cannot issue invitations');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select is((select count(*) from public.playlists),1::bigint,'Active members can read community content');
select lives_ok($$update public.playlists set title='Updated' where id='20000000-0000-0000-0000-000000000001'$$,'Creator can update playlist');
select is((select title from public.playlists limit 1),'Updated','Owner update is persisted');
select throws_ok($$update public.playlists set creator_id='10000000-0000-0000-0000-000000000002'$$,'42501',null,'Cannot transfer ownership');
select throws_ok($$update public.playlists set created_at=now()$$,'42501',null,'Cannot forge timestamps');
select throws_ok($$update private.memberships set role='admin'$$,'42501',null,'Cannot promote oneself');
select throws_ok($$insert into public.profiles(id,username,display_name) values ('10000000-0000-0000-0000-000000000003','intruder','Intruder')$$,'42501',null,'Cannot create profiles outside invitation redemption');
select lives_ok($$insert into public.saved_playlists(playlist_id) values ('20000000-0000-0000-0000-000000000001')$$,'Can save a playlist as self');
select lives_ok($$insert into public.follows(followed_id) values ('10000000-0000-0000-0000-000000000002')$$,'Can follow another member');
select lives_ok($$insert into public.listening_reports(playlist_id,label,context) values ('20000000-0000-0000-0000-000000000001','explicit language','At 10 minutes')$$,'Can add listening report');
select throws_ok($$insert into public.listening_reports(playlist_id,label) values ('20000000-0000-0000-0000-000000000001','explicit language')$$,'23505',null,'Duplicate listening reports rejected');
select throws_ok($$update public.playlists set energy_curve=array[0,6]::smallint[]$$,'23514',null,'Invalid energy curve rejected');
select throws_ok($$update public.playlists set links='{"other":"javascript:alert(1)"}'$$,'23514',null,'Unsafe URL scheme rejected');
select throws_ok($$update public.playlists set tracks='[{}]'$$,'23514',null,'Invalid track structure rejected');
select throws_ok($$update public.playlists set qualities=array['no vocals','sung lyrics']::music_tag[]$$,'23514',null,'Contradictory vocal tags rejected');
select lives_ok('select * from public.create_invitation()','Member can issue a secure invitation');
select is((select invites_remaining from public.my_membership()),2,'Issuing invitation consumes allowance');
select is((select count(*) from public.my_invitations()),3::bigint,'Member can list own invitation metadata');
select throws_ok('select token_hash from private.invitations','42501',null,'Invite hashes are inaccessible');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
set local role authenticated;
with changed as (update public.playlists set title='Stolen' returning id) select is(count(*),0::bigint,'Other member cannot edit playlist') from changed;
with removed as (delete from public.playlists returning id) select is(count(*),0::bigint,'Other member cannot delete playlist') from removed;
with changed as (update public.profiles set bio='Impersonated' where username='alice' returning id) select is(count(*),0::bigint,'Other member cannot edit profile') from changed;
select is((select count(*) from public.saved_playlists),0::bigint,'Saved lists are private');
select is((select count(*) from public.follows),0::bigint,'Followed lists are private');
select is(public.playlist_save_count('20000000-0000-0000-0000-000000000001'),1::bigint,'Aggregate save count is available');
select is(public.profile_follower_count('10000000-0000-0000-0000-000000000002'),1::bigint,'Aggregate follower count is available');
select is((select count(*) from public.my_invitations()),0::bigint,'Other member cannot list invitations');
with changed as (update public.listening_reports set context='Changed' returning label) select is(count(*),0::bigint,'Cannot overwrite another member listening report') from changed;
select throws_ok($$insert into public.playlist_comments(playlist_id,user_id,body) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Spoofed')$$,'42501',null,'Cannot spoof comment author');
select lives_ok($$insert into public.playlist_comments(playlist_id,body) values ('20000000-0000-0000-0000-000000000001','Useful playlist')$$,'Member can comment');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
set local role authenticated;
select is((select count(*) from public.playlists),0::bigint,'Verified nonmember cannot read content');
select throws_ok('select public.create_invitation()','42501',null,'Nonmember cannot issue invitations');
select throws_ok($$select public.redeem_invitation('wrong','new-user')$$,'22023',null,'Invalid invitation rejected');
select throws_ok($$select public.redeem_invitation('expired-invite','new-user')$$,'22023',null,'Expired invitation rejected');
select throws_ok($$select public.redeem_invitation('test-invite','alice')$$,'23505',null,'Duplicate username rolls back redemption');
select lives_ok($$select public.redeem_invitation('test-invite','new-user')$$,'Verified user can redeem unused invitation after failed profile insert');
select is((select count(*) from public.playlists),1::bigint,'Redeemed member gains community access');
select is((select role from public.my_membership()),'member','Redemption grants only member role');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
set local role authenticated;
select throws_ok($$select public.redeem_invitation('test-invite','unverified')$$,'42501',null,'Unverified email cannot redeem');
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000005',true);
set local role authenticated;
select throws_ok($$select public.redeem_invitation('test-invite','another')$$,'22023',null,'Invitation cannot be reused by another user');
reset role;

-- Suspension is checked against the database with an already-issued identity.
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
update private.memberships set status='suspended' where user_id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select is((select count(*) from public.playlists),0::bigint,'Suspension blocks reads with an existing session');
select is((select count(*) from public.saved_playlists),0::bigint,'Suspension blocks own saved data');
select throws_ok($$insert into public.playlist_comments(playlist_id,body) values ('20000000-0000-0000-0000-000000000001','Blocked')$$,'42501',null,'Suspension blocks writes');
select throws_ok('select public.create_invitation()','42501',null,'Suspension blocks invitation creation');
select is((select status from public.my_membership()),'suspended','Suspended user can see own membership status');
reset role;
update private.memberships set status='active',invites_remaining=0 where user_id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select throws_ok('select public.create_invitation()','42501',null,'Cannot exceed invitation allowance');
select lives_ok($$delete from public.playlists where id='20000000-0000-0000-0000-000000000001'$$,'Owner can delete own playlist');
select is((select count(*) from public.listening_reports),0::bigint,'Deleting playlist cleans related listening reports');
select is((select count(*) from public.saved_playlists),0::bigint,'Deleting playlist cleans saves');
reset role;
select * from finish();
rollback;
