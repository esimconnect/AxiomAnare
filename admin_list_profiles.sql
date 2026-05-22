-- admin_list_profiles.sql
-- OPTIONAL add-on for admin.html v1.
--
-- Problem: the subscriber list wants EMAIL, but profiles has no email column —
-- email lives in auth.users, which the browser (anon/authenticated) client
-- cannot read. The supabase-js admin API needs the service-role key, which must
-- never ship to the browser.
--
-- Solution: a SECURITY DEFINER function that joins auth.users to profiles and
-- enforces is_admin() *inside* the function. Only admins get rows; service-role
-- stays server-side. admin.html calls this first and falls back to a direct
-- profiles read (no email) if it is absent — so deploying this is optional.
--
-- Run in the Supabase SQL editor. Idempotent.

create or replace function public.admin_list_profiles()
returns table (
  id                  uuid,
  email               text,
  tier                public.tier_name,
  subscription_status public.subscription_status,
  analyses_used       int,
  org_id              uuid,
  created_at          timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Reuse the existing helper installed by rls_foundation_v2.sql.
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
    select p.id,
           u.email::text,
           p.tier,
           p.subscription_status,
           p.analyses_used,
           p.org_id,
           p.created_at
      from public.profiles p
      join auth.users u on u.id = p.id
     order by p.created_at desc nulls last;
end;
$$;

-- Lock it down: only authenticated callers may invoke; the body still requires
-- is_admin(), so a non-admin authenticated user gets a 'not authorized' error.
revoke all on function public.admin_list_profiles() from public;
grant execute on function public.admin_list_profiles() to authenticated;
