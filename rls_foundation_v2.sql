-- ══════════════════════════════════════════════════════════════════════════
-- AXIOMANARE — RLS FOUNDATION MIGRATION (v2 — table-existence-aware)
-- Closes the open "USING (true)" beta policies and installs org-scoped +
-- admin RLS. Adds is_admin to profiles. Wipes pre-RLS test data (Option A).
-- Idempotent and resilient: every table-specific step runs ONLY if that table
-- exists, so it matches your live DB even where it has drifted from the
-- committed schema (e.g. fault_detections / zone_progressions absent).
--
-- TENANCY: every profile points at an org_id; an individual = an org of one.
-- Customer data is org-scoped; an admin (profiles.is_admin) sees everything.
--
-- ── VERIFY DURING TESTING ──────────────────────────────────────────────────
--  1. bearing_library KEEPS anon read — the free diagnostic needs it.
--  2. nvr_records + silo locked to authenticated/org-scoped. If the logged-out
--     free flow writes there, those writes fail — flag it for a scoped anon
--     exception. Core diagnostic won't break.
--  3. Stripe webhook uses service_role (BYPASSRLS) — trigger exempts it so it
--     can still set tier on payment.
--  4. asset_twins, case_library, knowledge_chunks, usage_log,
--     subscription_events are ADMIN-ONLY (features not built yet).
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. SCHEMA: admin flag ──────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ── 2. HELPER FUNCTIONS (SECURITY DEFINER — break RLS recursion) ────────────
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $fn$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$fn$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $fn$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$fn$;

REVOKE ALL ON FUNCTION public.current_org_id() FROM public;
REVOKE ALL ON FUNCTION public.is_admin()       FROM public;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin()       TO anon, authenticated, service_role;

-- ── 3. PROFILE COLUMN-GUARD TRIGGER ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_cols()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $fn$
BEGIN
  IF auth.role() = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.tier     IS DISTINCT FROM OLD.tier     THEN
    RAISE EXCEPTION 'tier may only be changed by an administrator or billing system';
  END IF;
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'is_admin may only be changed by an administrator';
  END IF;
  IF NEW.org_id   IS DISTINCT FROM OLD.org_id   THEN
    RAISE EXCEPTION 'org_id may only be changed by an administrator';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_guard_profile_privileged_cols ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileged_cols
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_cols();

-- ── 4..10. ALL TABLE-SPECIFIC WORK, guarded by table existence ──────────────
-- One DO block. For each table: if it exists -> drop its policies, enable RLS,
-- create the correct policies. Tables that don't exist are silently skipped.
DO $mig$
DECLARE
  r record;
  t text;
  present text[];
BEGIN
  -- Collect which managed tables actually exist
  SELECT array_agg(tablename) INTO present
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = ANY(ARRAY[
      'organisations','assets','baselines','nvr_records','fault_detections',
      'profiles','fault_signatures','zone_progressions','bearing_library',
      'asset_twins','case_library','knowledge_chunks','usage_log',
      'subscription_events']);

  -- 4. Drop every existing policy on present managed tables
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename = ANY(present)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;

  -- 5. Enable RLS on each present table
  FOREACH t IN ARRAY present LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;

  -- helper to test presence
  -- (inline via = ANY(present) below)

  -- 6. CUSTOMER SILO
  IF 'profiles' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY profiles_select_own_or_admin ON public.profiles
      FOR SELECT USING (id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY profiles_insert_self ON public.profiles
      FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY profiles_update_own_or_admin ON public.profiles
      FOR UPDATE USING (id = auth.uid() OR public.is_admin())
                 WITH CHECK (id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY profiles_delete_admin ON public.profiles
      FOR DELETE USING (public.is_admin())$p$;
  END IF;

  IF 'organisations' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY organisations_select_member_or_admin ON public.organisations
      FOR SELECT USING (id = public.current_org_id() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY organisations_insert_authenticated ON public.organisations
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)$p$;
    EXECUTE $p$CREATE POLICY organisations_update_member_or_admin ON public.organisations
      FOR UPDATE USING (id = public.current_org_id() OR public.is_admin())
                 WITH CHECK (id = public.current_org_id() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY organisations_delete_admin ON public.organisations
      FOR DELETE USING (public.is_admin())$p$;
  END IF;

  IF 'assets' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY assets_all_org_or_admin ON public.assets
      FOR ALL USING (org_id = public.current_org_id() OR public.is_admin())
              WITH CHECK (org_id = public.current_org_id() OR public.is_admin())$p$;
  END IF;

  IF 'baselines' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY baselines_all_org_or_admin ON public.baselines
      FOR ALL USING (public.is_admin() OR asset_id IN (
        SELECT id FROM public.assets WHERE org_id = public.current_org_id()))
      WITH CHECK (public.is_admin() OR asset_id IN (
        SELECT id FROM public.assets WHERE org_id = public.current_org_id()))$p$;
  END IF;

  IF 'nvr_records' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY nvr_records_all_org_or_admin ON public.nvr_records
      FOR ALL USING (public.is_admin() OR asset_id IN (
        SELECT id FROM public.assets WHERE org_id = public.current_org_id()))
      WITH CHECK (public.is_admin() OR asset_id IN (
        SELECT id FROM public.assets WHERE org_id = public.current_org_id()))$p$;
  END IF;

  IF 'fault_detections' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY fault_detections_all_org_or_admin ON public.fault_detections
      FOR ALL USING (public.is_admin() OR nvr_id IN (
        SELECT n.id FROM public.nvr_records n
        JOIN public.assets a ON a.id = n.asset_id
        WHERE a.org_id = public.current_org_id()))
      WITH CHECK (public.is_admin() OR nvr_id IN (
        SELECT n.id FROM public.nvr_records n
        JOIN public.assets a ON a.id = n.asset_id
        WHERE a.org_id = public.current_org_id()))$p$;
  END IF;

  -- 7. CUMULATIVE SILO (anonymised, shared)
  IF 'fault_signatures' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY fault_signatures_select_auth ON public.fault_signatures
      FOR SELECT USING (auth.uid() IS NOT NULL OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY fault_signatures_insert_auth ON public.fault_signatures
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)$p$;
  END IF;

  IF 'zone_progressions' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY zone_progressions_select_auth ON public.zone_progressions
      FOR SELECT USING (auth.uid() IS NOT NULL OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY zone_progressions_insert_auth ON public.zone_progressions
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)$p$;
  END IF;

  -- 8. SHARED REFERENCE — bearing_library (anon read REQUIRED)
  IF 'bearing_library' = ANY(present) THEN
    EXECUTE $p$CREATE POLICY bearing_library_select_public ON public.bearing_library
      FOR SELECT USING (true)$p$;
    EXECUTE $p$CREATE POLICY bearing_library_write_admin ON public.bearing_library
      FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())$p$;
  END IF;

  -- 9. NOT-YET-BUILT — admin-only
  FOREACH t IN ARRAY ARRAY['asset_twins','case_library','knowledge_chunks',
                           'usage_log','subscription_events'] LOOP
    IF t = ANY(present) THEN
      EXECUTE format($p$CREATE POLICY %I ON public.%I
        FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())$p$,
        t||'_admin', t);
    END IF;
  END LOOP;

  -- 10. WIPE pre-RLS test data (Option A) — only tables that exist.
  -- Build a TRUNCATE over the present transactional tables.
  DECLARE
    wipe text[] := ARRAY[]::text[];
  BEGIN
    IF 'fault_detections' = ANY(present) THEN wipe := array_append(wipe, 'public.fault_detections'); END IF;
    IF 'nvr_records'      = ANY(present) THEN wipe := array_append(wipe, 'public.nvr_records');      END IF;
    IF 'baselines'        = ANY(present) THEN wipe := array_append(wipe, 'public.baselines');        END IF;
    IF 'assets'           = ANY(present) THEN wipe := array_append(wipe, 'public.assets');           END IF;
    IF array_length(wipe,1) IS NOT NULL THEN
      EXECUTE 'TRUNCATE ' || array_to_string(wipe, ', ') || ' CASCADE';
    END IF;
  END;

END
$mig$;

COMMIT;

-- ── 11. BOOTSTRAP YOUR ADMIN (run once, manually, AFTER you sign up) ────────
--   UPDATE public.profiles SET is_admin = true
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
-- Then: SELECT * FROM public.profiles;  -- expect your row. If empty, the
-- handle_new_user signup trigger isn't firing and needs fixing first.
