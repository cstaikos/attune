-- LOCAL ONLY: fictional moderation fixtures. Safe to rerun; existing rows and decisions are preserved.

begin;

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
 values('00000000-0000-0000-0000-000000000000','90000000-0000-4000-0001-000000000001','authenticated','authenticated','admin@attune.local',extensions.crypt('Attune-local-2026!',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','') on conflict(id) do nothing;
insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
 values('90000000-0000-4000-0001-000000000001','90000000-0000-4000-0001-000000000001','90000000-0000-4000-0001-000000000001','{"sub":"90000000-0000-4000-0001-000000000001","email":"admin@attune.local","email_verified":true}','email',now(),now(),now()) on conflict do nothing;
insert into private.memberships(user_id,role) values('90000000-0000-4000-0001-000000000001','admin') on conflict do nothing;
insert into public.profiles(id,username,display_name,practice,location,bio) values('90000000-0000-4000-0001-000000000001','demo-admin','Demo Administrator','Administration','Toronto','Fictional local demo profile for testing playlists and moderation.') on conflict do nothing;

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
 values('00000000-0000-0000-0000-000000000000','90000000-0000-4000-0001-000000000002','authenticated','authenticated','maya@attune.local',extensions.crypt('Attune-local-2026!',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','') on conflict(id) do nothing;
insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
 values('90000000-0000-4000-0001-000000000002','90000000-0000-4000-0001-000000000002','90000000-0000-4000-0001-000000000002','{"sub":"90000000-0000-4000-0001-000000000002","email":"maya@attune.local","email_verified":true}','email',now(),now(),now()) on conflict do nothing;
insert into private.memberships(user_id,role) values('90000000-0000-4000-0001-000000000002','member') on conflict do nothing;
insert into public.profiles(id,username,display_name,practice,location,bio) values('90000000-0000-4000-0001-000000000002','demo-maya','Maya Chen','Meditation','Toronto','Fictional local demo profile for testing playlists and moderation.') on conflict do nothing;

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
 values('00000000-0000-0000-0000-000000000000','90000000-0000-4000-0001-000000000003','authenticated','authenticated','leo@attune.local',extensions.crypt('Attune-local-2026!',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','') on conflict(id) do nothing;
insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
 values('90000000-0000-4000-0001-000000000003','90000000-0000-4000-0001-000000000003','90000000-0000-4000-0001-000000000003','{"sub":"90000000-0000-4000-0001-000000000003","email":"leo@attune.local","email_verified":true}','email',now(),now(),now()) on conflict do nothing;
insert into private.memberships(user_id,role) values('90000000-0000-4000-0001-000000000003','member') on conflict do nothing;
insert into public.profiles(id,username,display_name,practice,location,bio) values('90000000-0000-4000-0001-000000000003','demo-leo','Leo Rivera','Breathwork','Toronto','Fictional local demo profile for testing playlists and moderation.') on conflict do nothing;

insert into public.playlists(id,creator_id,title,modality,duration_minutes,energy_curve,qualities,notes,links,hidden)
 values('90000000-0000-4000-0002-000000000001','90000000-0000-4000-0001-000000000002','Quiet morning','Meditation',35,array[1,2,3,2,1]::smallint[],array['ambient','gentle','no vocals']::public.music_tag[],'A gentle instrumental set for a slow start. Fictional demo playlist.','{"other":"https://example.com/demo-playlist-1"}',false) on conflict do nothing;

insert into public.playlists(id,creator_id,title,modality,duration_minutes,energy_curve,qualities,notes,links,hidden)
 values('90000000-0000-4000-0002-000000000002','90000000-0000-4000-0001-000000000003','Breath and movement','Breathwork',50,array[1,2,3,2,1]::smallint[],array['ambient','gentle','no vocals']::public.music_tag[],'A gradual build followed by a quiet landing. Open reports are ready for review.','{"other":"https://example.com/demo-playlist-2"}',false) on conflict do nothing;

insert into public.playlists(id,creator_id,title,modality,duration_minutes,energy_curve,qualities,notes,links,hidden)
 values('90000000-0000-4000-0002-000000000003','90000000-0000-4000-0001-000000000002','Evening reset','Meditation',25,array[1,2,3,2,1]::smallint[],array['ambient','gentle','no vocals']::public.music_tag[],'Hidden demo playlist. Restore it from Administration to make it visible to members.','{"other":"https://example.com/demo-playlist-3"}',true) on conflict do nothing;

insert into public.playlists(id,creator_id,title,modality,duration_minutes,energy_curve,qualities,notes,links,hidden)
 values('90000000-0000-4000-0002-000000000004','90000000-0000-4000-0001-000000000003','Reflective afternoon','Meditation',45,array[1,2,3,2,1]::smallint[],array['ambient','gentle','no vocals']::public.music_tag[],'A spacious demo playlist with both visible and hidden comments.','{"other":"https://example.com/demo-playlist-4"}',false) on conflict do nothing;

insert into public.playlist_comments(id,playlist_id,user_id,body,hidden) values('90000000-0000-4000-0003-000000000001','90000000-0000-4000-0002-000000000001','90000000-0000-4000-0001-000000000003','The gentle opening worked well for my listening session.',false) on conflict do nothing;

insert into public.playlist_comments(id,playlist_id,user_id,body,hidden) values('90000000-0000-4000-0003-000000000002','90000000-0000-4000-0002-000000000004','90000000-0000-4000-0001-000000000003','Demo comment hidden after review. Restore it to test comment visibility.',true) on conflict do nothing;

insert into public.playlist_comments(id,playlist_id,user_id,body,hidden) values('90000000-0000-4000-0003-000000000003','90000000-0000-4000-0002-000000000002','90000000-0000-4000-0001-000000000003','Demo comment with an open report for the administrator to review.',false) on conflict do nothing;

insert into public.private_reports(id,reporter_id,target_type,target_id,reason,status,created_at) values('90000000-0000-4000-0004-000000000001','90000000-0000-4000-0001-000000000002','playlist','90000000-0000-4000-0002-000000000002','Please review the description for misleading claims. Member-submitted demo report.','open',now()-interval '1 hours') on conflict do nothing;

insert into public.private_reports(id,reporter_id,target_type,target_id,reason,status,created_at) values('90000000-0000-4000-0004-000000000002','90000000-0000-4000-0001-000000000001','playlist','90000000-0000-4000-0002-000000000002','Administrator-submitted demo report on the same playlist. Hiding should resolve both reports.','open',now()-interval '2 hours') on conflict do nothing;

insert into public.private_reports(id,reporter_id,target_type,target_id,reason,status,created_at) values('90000000-0000-4000-0004-000000000003','90000000-0000-4000-0001-000000000002','playlist','90000000-0000-4000-0002-000000000003','Demo report resolved when the playlist was hidden.','resolved',now()-interval '3 hours') on conflict do nothing;

insert into public.private_reports(id,reporter_id,target_type,target_id,reason,status,created_at) values('90000000-0000-4000-0004-000000000004','90000000-0000-4000-0001-000000000002','comment','90000000-0000-4000-0003-000000000002','Demo report resolved when the comment was hidden.','resolved',now()-interval '4 hours') on conflict do nothing;

insert into public.private_reports(id,reporter_id,target_type,target_id,reason,status,created_at) values('90000000-0000-4000-0004-000000000005','90000000-0000-4000-0001-000000000003','profile','90000000-0000-4000-0001-000000000002','Demo profile report reviewed and dismissed.','dismissed',now()-interval '5 hours') on conflict do nothing;

insert into public.private_reports(id,reporter_id,target_type,target_id,reason,status,created_at) values('90000000-0000-4000-0004-000000000006','90000000-0000-4000-0001-000000000002','comment','90000000-0000-4000-0003-000000000003','Please review this comment. Open demo report.','open',now()-interval '6 hours') on conflict do nothing;

insert into public.moderation_audit(id,actor_id,action,target_type,target_id,reason,before_state,after_state)
 values('90000000-0000-4000-0005-000000000001','90000000-0000-4000-0001-000000000001','hide','playlist','90000000-0000-4000-0002-000000000003','Fictional seed review: content hidden.','{"hidden":false}','{"hidden":true}') on conflict do nothing;

insert into public.moderation_audit(id,actor_id,action,target_type,target_id,reason,before_state,after_state)
 values('90000000-0000-4000-0005-000000000002','90000000-0000-4000-0001-000000000001','hide','comment','90000000-0000-4000-0003-000000000002','Fictional seed review: content hidden.','{"hidden":false}','{"hidden":true}') on conflict do nothing;

commit;
