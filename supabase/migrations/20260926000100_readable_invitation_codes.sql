-- Retain new codes so their creator can share them again later. Legacy hashes
-- cannot be reversed; those invitations keep working through their original link.
alter table private.invitations add column shareable_code text;

create or replace function public.create_invitation() returns table(id uuid,code text,expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare token text; invitation private.invitations;
begin
 if not private.is_active_member() then raise exception 'Active membership required' using errcode='42501'; end if;
 update private.memberships set invites_remaining=invites_remaining-1
 where user_id=auth.uid() and status='active' and invites_remaining>0;
 if not found then raise exception 'No invitations remaining' using errcode='42501'; end if;
 token=encode(extensions.gen_random_bytes(32),'hex');
 insert into private.invitations(token_hash,shareable_code,created_by)
 values (extensions.digest(token,'sha256'),token,auth.uid()) returning * into invitation;
 return query select invitation.id,token,invitation.expires_at;
end $$;

drop function public.my_invitations();
create function public.my_invitations() returns table(id uuid,created_by uuid,redeemed_by uuid,expires_at timestamptz,created_at timestamptz,code text)
language sql stable security definer set search_path = '' as $$
 select i.id,i.created_by,i.redeemed_by,i.expires_at,i.created_at,i.shareable_code
 from private.invitations i
 where private.is_active_member() and i.created_by=auth.uid()
 order by i.created_at desc, i.id;
$$;
revoke all on function public.my_invitations() from public,anon;
grant execute on function public.my_invitations() to authenticated;
