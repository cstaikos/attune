begin;
create extension if not exists pgtap with schema extensions;
set search_path=public,extensions;
select no_plan();
insert into auth.users(id,email,email_confirmed_at) values
 ('31000000-0000-0000-0000-000000000001','admin@moderation.test',now()),
 ('31000000-0000-0000-0000-000000000002','member@moderation.test',now()),
 ('31000000-0000-0000-0000-000000000003','other@moderation.test',now());
insert into private.memberships(user_id,role) values
 ('31000000-0000-0000-0000-000000000001','admin'),('31000000-0000-0000-0000-000000000002','member'),('31000000-0000-0000-0000-000000000003','member');
insert into public.profiles(id,username,display_name) values
 ('31000000-0000-0000-0000-000000000001','mod-admin','Admin'),('31000000-0000-0000-0000-000000000002','mod-member','Member'),('31000000-0000-0000-0000-000000000003','mod-other','Other');
insert into public.playlists(id,creator_id,title,modality,duration_minutes,energy_curve,qualities,links) values
 ('32000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000002','Moderated playlist','Meditation',30,array[1,2]::smallint[],array['ambient']::music_tag[],'{"other":"https://example.com/music"}');
insert into public.playlist_comments(id,playlist_id,user_id,body) values
 ('33000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000002','Comment under review');
insert into public.listening_reports(playlist_id,user_id,label,context) values
 ('32000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000002','explicit language','Private context when hidden');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select lives_ok($$select public.submit_private_report('profile','31000000-0000-0000-0000-000000000003','Review this profile')$$,'Member can report privately');
select is((select count(*) from public.private_reports where reporter_id in ('31000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000002')),1::bigint,'Reporter sees own report');
select throws_ok($$select public.moderate('grant_admin','member','31000000-0000-0000-0000-000000000002','Escalate')$$,'42501',null,'Member cannot escalate');
select throws_ok('select * from public.admin_members()','42501',null,'Member cannot list access records');
select throws_ok('delete from public.moderation_audit','42501',null,'Audit cannot be deleted');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.private_reports where reporter_id in ('31000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000002')),0::bigint,'Reported user cannot see report');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000001',true);
select is((select count(*) from public.private_reports where reporter_id in ('31000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000002')),1::bigint,'Admin sees reports');
select lives_ok($$select public.moderate('suspend','member','31000000-0000-0000-0000-000000000002','Abuse')$$,'Admin can suspend');
select is((select count(*) from public.moderation_audit where actor_id='31000000-0000-0000-0000-000000000001'),1::bigint,'Action creates audit event');
select throws_ok($$select public.moderate('suspend','member','31000000-0000-0000-0000-000000000001','Self')$$,'P0001','You cannot change your own access','Cannot remove own access');
select lives_ok($$select public.moderate('resolve','report',(select id from public.private_reports where reporter_id='31000000-0000-0000-0000-000000000002' limit 1),'Resolved')$$,'Resolve report');
select throws_ok('update public.moderation_audit set reason=''forged''','42501',null,'Even admin cannot rewrite audit');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000002',true);
select is((select count(*) from public.profiles),0::bigint,'Suspension revokes read access with existing JWT');
select throws_ok($$select public.submit_private_report('profile','31000000-0000-0000-0000-000000000003','Again')$$,'42501',null,'Suspension blocks reporting');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.moderate('hide','comment','33000000-0000-0000-0000-000000000001','Comment removed')$$,'Hide comment');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.playlist_comments where id='33000000-0000-0000-0000-000000000001'),0::bigint,'Hidden comments are inaccessible directly');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.moderate('restore','comment','33000000-0000-0000-0000-000000000001','Appeal')$$,'Restore comment');
select lives_ok($$select public.submit_private_report('playlist','32000000-0000-0000-0000-000000000001','Admin test report')$$,'Admin can report content');
select lives_ok($$select public.moderate('hide','playlist','32000000-0000-0000-0000-000000000001','Review')$$,'Hide playlist');
select is((select count(*) from public.playlists where id='32000000-0000-0000-0000-000000000001'),1::bigint,'Admin can review hidden content');
select is((select status from public.private_reports where target_type='playlist' and target_id='32000000-0000-0000-0000-000000000001'),'resolved','Hiding resolves admin report');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.playlists where id='32000000-0000-0000-0000-000000000001'),0::bigint,'Members cannot read hidden playlist');
select is((select count(*) from public.playlist_comments where id='33000000-0000-0000-0000-000000000001'),0::bigint,'Hiding playlist hides its comments');
select is((select count(*) from public.listening_reports where playlist_id='32000000-0000-0000-0000-000000000001'),0::bigint,'Hidden playlist listening context is inaccessible');
select throws_ok($$insert into public.playlist_comments(playlist_id,body) values('32000000-0000-0000-0000-000000000001','Bypass')$$,'42501',null,'Cannot comment on hidden content by ID');
select throws_ok($$insert into public.listening_reports(playlist_id,label,context) values('32000000-0000-0000-0000-000000000001','explicit language','Bypass')$$,'42501',null,'Cannot add notes to hidden content by ID');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.moderate('restore','playlist','32000000-0000-0000-0000-000000000001','Appeal')$$,'Restore playlist');
select lives_ok($$select public.moderate('unsuspend','member','31000000-0000-0000-0000-000000000002','Appeal')$$,'Restore account');
select lives_ok($$select public.moderate('grant_admin','member','31000000-0000-0000-0000-000000000003','Appointed')$$,'Grant admin');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000003',true);
select lives_ok('select * from public.admin_members()','Granted admin has access');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.moderate('revoke_admin','member','31000000-0000-0000-0000-000000000003','Term ended')$$,'Revoke admin');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000003',true);
select throws_ok('select * from public.admin_members()','42501',null,'Revocation applies immediately to existing JWT');
select is((select count(*) from public.moderation_audit where actor_id='31000000-0000-0000-0000-000000000001'),0::bigint,'Revoked admin cannot read audit');
select set_config('request.jwt.claim.sub','31000000-0000-0000-0000-000000000001',true);
select is((select count(*) from public.moderation_audit where actor_id='31000000-0000-0000-0000-000000000001'),10::bigint,'Successful actions each have an audit event');
select ok((select bool_and(before_state is not null and after_state is not null) from public.moderation_audit where actor_id='31000000-0000-0000-0000-000000000001'),'Audit preserves before and after states');
select * from finish();
rollback;
