-- LOCAL ONLY. Fictional fixtures for search, filters, paging, and moderation.
-- Stable IDs + DO NOTHING preserve edits and decisions when this file is rerun.
begin;
do $$
declare
  n integer; j integer; member_id uuid; playlist_id uuid; comment_id uuid;
  fixture_id uuid; actor uuid := '90000000-0000-4000-0001-000000000001';
  maya uuid := '90000000-0000-4000-0001-000000000002';
  leo uuid := '90000000-0000-4000-0001-000000000003';
  password_hash text := extensions.crypt('Attune-local-2026!',extensions.gen_salt('bf'));
  first_names text[] := array['Amara','Noah','Priya','Oliver','Sofia','Ethan','Isla','Kai','Zara','Mateo','Avery','Lina'];
  last_names text[] := array['Patel','Rivera','Chen','Morgan'];
  cities text[] := array['Toronto','Vancouver','Montreal','Ottawa','Calgary','Halifax'];
  practices text[] := array['Meditation','Breathwork','Integration support','Music therapy','Somatic practice','Community facilitation'];
  moods text[] := array['Morning light','Forest pause','Quiet waters','Open sky','Gentle return','Evening glow','Steady ground','New beginnings','Soft landing','Slow tides','Warm embrace','Spacious moments'];
  modalities public.modality[] := enum_range(null::public.modality);
  labels public.listening_label[] := enum_range(null::public.listening_label);
  target_kind text; target_uuid uuid; report_status text; hidden_now boolean;
begin
  for n in 1..48 loop
    member_id := ('91000000-0000-4000-0001-' || lpad(n::text,12,'0'))::uuid;
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
    values('00000000-0000-0000-0000-000000000000',member_id,'authenticated','authenticated',
      'member' || n || '@attune.local',password_hash,now(),'{"provider":"email","providers":["email"]}','{}',
      now()-n*interval '1 day',now(),'','','','') on conflict(id) do nothing;
    insert into auth.identities(id,provider_id,user_id,identity_data,provider,created_at,updated_at)
    values(member_id,member_id::text,member_id,jsonb_build_object('sub',member_id,'email','member' || n || '@attune.local','email_verified',true),
      'email',now(),now()) on conflict do nothing;
    insert into private.memberships(user_id,role,status)
    values(member_id,case when n in (1,2) then 'admin' else 'member' end,case when n>44 then 'suspended' else 'active' end) on conflict do nothing;
    insert into public.profiles(id,username,display_name,practice,location,bio)
    values(member_id,'demo-member-' || n,first_names[1+(n-1)%12] || ' ' || last_names[1+(n-1)/12],
      practices[1+(n-1)%6],cities[1+(n-1)%6],
      'Fictional demo practitioner. I enjoy exploring ' || lower(practices[1+(n-1)%6]) || ' and sharing thoughtful listening notes with the community.')
    on conflict do nothing;
  end loop;

  for n in 1..120 loop
    playlist_id := ('91000000-0000-4000-0002-' || lpad(n::text,12,'0'))::uuid;
    member_id := case when n<=30 then maya when n<=60 then leo when n<=75 then actor
      else ('91000000-0000-4000-0001-' || lpad((1+(n-1)%44)::text,12,'0'))::uuid end;
    hidden_now := n between 81 and 100;
    insert into public.playlists(id,creator_id,title,modality,duration_minutes,energy_curve,qualities,
      listening_reviewed,listening_context,notes,links,tracks,cover_a,cover_b,hidden,created_at)
    values(playlist_id,member_id,moods[1+(n-1)%12] || ' · ' || n,
      modalities[1+(n-1)%6],20+10*(n%16),
      case when n%2=0 then array[1,2,4,3,2,1]::smallint[] else array[1,1,2,2,1]::smallint[] end,
      case n%4 when 0 then array['ambient','gentle','no vocals']::public.music_tag[]
        when 1 then array['acoustic','warm','wordless vocals']::public.music_tag[]
        when 2 then array['electronic','driving','spacious']::public.music_tag[]
        else array['classical','reflective','melancholic']::public.music_tag[] end,
      n%3<>0,case when n%3<>0 then 'Demo review: listen through before using in a session.' else '' end,
      'Fictional demo playlist for testing. Music links and tracks are placeholders. ' ||
      case when n%2=0 then 'Builds gradually before a gentle landing.' else 'A quiet, spacious arc with room to pause.' end,
      case n%3 when 0 then jsonb_build_object('spotify','https://open.spotify.com/playlist/' || lpad(n::text,22,'0'))
        when 1 then jsonb_build_object('youtube','https://www.youtube.com/playlist?list=PLDemo' || n)
        else jsonb_build_object('other','https://example.com/demo-playlist-' || n) end,
      jsonb_build_array(jsonb_build_object('title','Arrival','artist','Demo ensemble'),jsonb_build_object('title','A little space','artist','Demo ensemble')),
      case n%3 when 0 then '#64765b' when 1 then '#718da1' else '#ab837a' end,
      case n%3 when 0 then '#e6b56a' when 1 then '#d7e3d5' else '#e6d7c1' end,
      hidden_now,now()-n*interval '2 hours') on conflict do nothing;
    for j in 1..3 loop
      comment_id := ('91000000-0000-4000-0003-' || lpad(((n-1)*3+j)::text,12,'0'))::uuid;
      insert into public.playlist_comments(id,playlist_id,user_id,body,hidden,created_at)
      values(comment_id,playlist_id,case when j=1 then maya when j=2 then leo else actor end,
        (array['The opening feels spacious. I would leave a pause before the next section.',
         'The middle section is more energetic; worth previewing for the setting.',
         'I appreciate the gentle ending. Demo discussion for moderation testing.'])[j],
         ((n-1)*3+j)%10=0,now()-n*interval '1 hour'+j*interval '1 minute') on conflict do nothing;
    end loop;
    insert into public.listening_reports(playlist_id,user_id,label,context)
    values(playlist_id,member_id,labels[1+(n-1)%10],'Demo listening note: review the transition around minute ' || (5+n%20)) on conflict do nothing;
    insert into public.saved_playlists(user_id,playlist_id) values(maya,playlist_id),(leo,playlist_id),(actor,playlist_id) on conflict do nothing;
  end loop;

  -- A long comment thread on the first playlist.
  for n in 361..396 loop
    insert into public.playlist_comments(id,playlist_id,user_id,body,created_at)
    values(('91000000-0000-4000-0003-' || lpad(n::text,12,'0'))::uuid,'91000000-0000-4000-0002-000000000001',
      maya,'Discussion note ' || (n-360) || ': fictional feedback for testing comment pages.',now()+n*interval '1 second') on conflict do nothing;
  end loop;

  for n in 1..120 loop
    target_kind := (array['playlist','comment','profile'])[1+(n-1)%3];
    target_uuid := case target_kind
      when 'playlist' then ('91000000-0000-4000-0002-' || lpad(n::text,12,'0'))::uuid
      when 'comment' then ('91000000-0000-4000-0003-' || lpad(n::text,12,'0'))::uuid
      else ('91000000-0000-4000-0001-' || lpad((1+(n-1)%44)::text,12,'0'))::uuid end;
    report_status := (array['open','resolved','dismissed'])[1+((n-1)/3)%3];
    if (target_kind='playlist' and exists(select 1 from public.playlists p where p.id=target_uuid and p.hidden))
      or (target_kind='comment' and exists(select 1 from public.playlist_comments c where c.id=target_uuid and c.hidden)) then
      report_status := 'resolved';
    end if;
    fixture_id := ('91000000-0000-4000-0004-' || lpad(n::text,12,'0'))::uuid;
    insert into public.private_reports(id,reporter_id,target_type,target_id,reason,status,created_at)
    values(fixture_id,case when n%4=0 then actor when n%2=0 then leo else maya end,target_kind,target_uuid,
      (array['Broken or incorrect content','Spam or advertising','Privacy concern','Misleading or unsafe claims'])[1+n%4] ||
      ': fictional report ' || n || ' for testing administrator review.',report_status,now()-n*interval '3 hours')
    on conflict do nothing;
    if report_status<>'open' then
      insert into public.moderation_audit(id,actor_id,action,target_type,target_id,reason,before_state,after_state,created_at)
      values(('91000000-0000-4000-0005-' || lpad(n::text,12,'0'))::uuid,actor,
        case report_status when 'resolved' then 'resolve' else 'dismiss' end,'report',fixture_id,
        'Fictional review completed for demo report ' || n,jsonb_build_object('status','open'),jsonb_build_object('status',report_status),
        now()-n*interval '2 hours') on conflict do nothing;
    end if;
  end loop;

  -- Audited hide/restore histories; final flags match the newest seed event.
  for n in 1..60 loop
    target_kind := case when n<=24 then 'playlist' else 'comment' end;
    target_uuid := case when n<=24 then ('91000000-0000-4000-0002-' || lpad((80+n)::text,12,'0'))::uuid
      else ('91000000-0000-4000-0003-' || lpad(((n-24)*10)::text,12,'0'))::uuid end;
    hidden_now := not (n between 21 and 24);
    insert into public.moderation_audit(id,actor_id,action,target_type,target_id,reason,before_state,after_state,created_at)
    values(('91000000-0000-4000-0006-' || lpad(n::text,12,'0'))::uuid,actor,'hide',target_kind,target_uuid,
      'Fictional content review: hidden for moderation.','{"hidden":false}','{"hidden":true}',now()-n*interval '4 hours')
    on conflict do nothing;
    if not hidden_now then
      insert into public.moderation_audit(id,actor_id,action,target_type,target_id,reason,before_state,after_state,created_at)
      values(('91000000-0000-4000-0007-' || lpad(n::text,12,'0'))::uuid,actor,'restore',target_kind,target_uuid,
        'Fictional appeal accepted: content restored.','{"hidden":true}','{"hidden":false}',now()-n*interval '3 hours')
      on conflict do nothing;
    end if;
  end loop;

  for n in 1..60 loop
    fixture_id := ('91000000-0000-4000-0008-' || lpad(n::text,12,'0'))::uuid;
    insert into private.invitations(id,token_hash,created_by,redeemed_by,redeemed_at,expires_at,created_at)
    values(fixture_id,extensions.digest('DEMO-INVITE-' || n,'sha256'),case when n<=30 then maya else actor end,
      case when n<=12 then ('91000000-0000-4000-0001-' || lpad(n::text,12,'0'))::uuid else null end,
      case when n<=12 then now()-interval '1 day' else null end,
      case when n%3=0 then now()-interval '2 days' else now()+interval '14 days' end,now()-n*interval '1 hour')
    on conflict do nothing;
  end loop;
  for n in 1..44 loop
    member_id := ('91000000-0000-4000-0001-' || lpad(n::text,12,'0'))::uuid;
    insert into public.follows(follower_id,followed_id) values(maya,member_id),(actor,member_id) on conflict do nothing;
  end loop;
  -- Every membership action is represented without altering existing fixture users.
  for n in 1..8 loop
    member_id := ('91000000-0000-4000-0001-' || lpad((case when n<=2 then n when n<=4 then 3 when n<=6 then 4 else n+38 end)::text,12,'0'))::uuid;
    insert into public.moderation_audit(id,actor_id,action,target_type,target_id,reason,before_state,after_state,created_at)
    values(('91000000-0000-4000-0009-' || lpad(n::text,12,'0'))::uuid,actor,
      (array['grant_admin','grant_admin','grant_admin','revoke_admin','suspend','unsuspend','suspend','suspend'])[n],
      'member',member_id,'Fictional account review for pagination and audit filters.',
      case when n<=3 then '{"role":"member"}'::jsonb when n=4 then '{"role":"admin"}'::jsonb when n=6 then '{"status":"suspended"}'::jsonb else '{"status":"active"}'::jsonb end,
      case when n<=3 then '{"role":"admin"}'::jsonb when n=4 then '{"role":"member"}'::jsonb when n=6 then '{"status":"active"}'::jsonb else '{"status":"suspended"}'::jsonb end,
      now()-(20-n)*interval '1 day') on conflict do nothing;
  end loop;
end $$;
commit;
