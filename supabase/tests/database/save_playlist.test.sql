begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
insert into auth.users(id,email,email_confirmed_at) values
 ('30000000-0000-0000-0000-000000000001','save-owner@example.test',now()),
 ('30000000-0000-0000-0000-000000000002','save-other@example.test',now());
insert into private.memberships(user_id) values
 ('30000000-0000-0000-0000-000000000001'),('30000000-0000-0000-0000-000000000002');
insert into public.profiles(id,username,display_name) values
 ('30000000-0000-0000-0000-000000000001','save-owner','Owner'),
 ('30000000-0000-0000-0000-000000000002','save-other','Other');
create temporary table test_draft(value jsonb);
insert into test_draft values ('{"title":"Atomic playlist","modality":"Meditation","duration_minutes":30,"energy_curve":[1,2],"qualities":["ambient"],"listening_reviewed":true,"listening_context":"","notes":"","links":{"other":"https://example.com/music"},"tracks":[]}');
grant select on test_draft to authenticated;

set local role anon;
select throws_ok($$select public.save_playlist(null,'{}','{}')$$,'42501',null,'Anonymous callers cannot save playlists');
reset role;
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.save_playlist(null,(select value from test_draft),array['explicit language']::public.listening_label[])$$,'Member creates playlist and labels atomically');
select is((select count(*) from public.playlists where title='Atomic playlist'),1::bigint,'Playlist persisted');
select is((select count(*) from public.listening_reports where user_id=auth.uid()),1::bigint,'Creator label persisted');
select lives_ok($$update public.listening_reports set context='Keep this context' where user_id=auth.uid()$$,'Creator may explain a label');
select lives_ok($$select public.save_playlist((select id from public.playlists where title='Atomic playlist'),(select value from test_draft),array['explicit language','explicit language']::public.listening_label[])$$,'Repeated labels deduplicate');
select is((select context from public.listening_reports where user_id=auth.uid()),'Keep this context','Editing retains the context of selected labels');
select throws_ok($$select public.save_playlist((select id from public.playlists where title='Atomic playlist'),(select value || '{"title":""}'::jsonb from test_draft),'{}')$$,'23514',null,'Invalid edits fail');
select is((select count(*) from public.listening_reports where user_id=auth.uid()),1::bigint,'Failed edit leaves labels intact');
reset role;

select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select throws_ok($$select public.save_playlist((select id from public.playlists where title='Atomic playlist'),(select value from test_draft),'{}')$$,'42501',null,'Other members cannot edit through the RPC');
insert into public.listening_reports(playlist_id,label,context) select id,'sudden loud sounds','Other member context' from public.playlists where title='Atomic playlist';
reset role;

select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.save_playlist((select id from public.playlists where title='Atomic playlist'),(select value from test_draft),'{}')$$,'Owner can remove own labels');
select is((select count(*) from public.listening_reports where user_id=auth.uid()),0::bigint,'Own labels removed');
select is((select context from public.listening_reports where user_id='30000000-0000-0000-0000-000000000002'),'Other member context','Other members reports survive editing');
-- Match the editor payload, including two links from the same provider.
select lives_ok($$select public.save_playlist(null,
 (select value || '{"title":"Multiple editor links","links":{"url0":"https://open.spotify.com/playlist/first","url1":"https://open.spotify.com/playlist/second","url2":"https://example.com/music"}}'::jsonb from test_draft),'{}')$$,
 'Editor indexed links can create a playlist');
select is((select links->>'url1' from public.playlists where title='Multiple editor links'),'https://open.spotify.com/playlist/second','Second link from the same provider is preserved');
select lives_ok($$select public.save_playlist((select id from public.playlists where title='Multiple editor links'),
 (select value || '{"title":"Multiple editor links","links":{"url0":"https://www.youtube.com/playlist?list=PLtest","url1":"https://example.org/music"}}'::jsonb from test_draft),'{}')$$,
 'Editor indexed links can update a playlist');
select is((select links->>'url1' from public.playlists where title='Multiple editor links'),'https://example.org/music','Updated indexed link persists');
select ok(private.valid_playlist_links('{"spotify":"https://open.spotify.com/playlist/old"}'),'Legacy provider keys remain valid');
select ok(not private.valid_playlist_links('{"url0":"javascript:alert(1)"}'),'Indexed keys do not permit unsafe URL schemes');
select ok(not private.valid_playlist_links('{"url0":42}'),'Indexed values must be strings');
select ok(not private.valid_playlist_links('{"unexpected":"https://example.com/"}'),'Unrecognized key format is rejected');
select ok(not private.valid_playlist_links('{}'),'An empty link object remains invalid');
select ok(not private.valid_playlist_links(jsonb_build_object('url0','https://example.com/' || repeat('x',2048))),'Link length remains bounded');
reset role;
update private.memberships set status='suspended' where user_id='30000000-0000-0000-0000-000000000001';
set local role authenticated;
select throws_ok($$select public.save_playlist(null,(select value from test_draft),'{}')$$,'42501',null,'Suspended members cannot save');
reset role;
select * from finish();
rollback;
