-- LOCAL ONLY: bootstrap the first verified test member. Never deploy this seed
-- to staging/production. Subsequent invitations are random and issued by members.
insert into private.invitations(id,token_hash,expires_at)
values ('00000000-0000-0000-0000-000000000001',
  extensions.digest('DEV-ATTUNE-LOCAL-ONLY','sha256'),now()+interval '30 days')
on conflict (id) do nothing;
