begin;
-- Child records must not expose or add discussion to a hidden playlist through
-- direct API requests. Administrators retain access for moderation review.
create policy visible_playlist on public.playlist_comments as restrictive
for all to authenticated
using (exists(select 1 from public.playlists p where p.id=playlist_id))
with check (exists(select 1 from public.playlists p where p.id=playlist_id));
create policy visible_playlist on public.listening_reports as restrictive
for all to authenticated
using (exists(select 1 from public.playlists p where p.id=playlist_id))
with check (exists(select 1 from public.playlists p where p.id=playlist_id));
commit;
