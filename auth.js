// auth.js — AxiomAnare shared authentication module
// Depends on: Supabase JS client (loaded in host page)
// Usage: import or load before any page that needs auth
// All pages must define SUPABASE_URL and SUPABASE_ANON_KEY before loading this file

(function (global) {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  const TIER_LIMITS = {
    free:          { analyses: 2,         assets: 0,  aiReport: false, fleet: false },
    pro:           { analyses: Infinity,  assets: 0,  aiReport: true,  fleet: false },
    fleet_starter: { analyses: Infinity,  assets: 10, aiReport: true,  fleet: true  },
    fleet_pro:     { analyses: Infinity,  assets: 30, aiReport: true,  fleet: true  },
  };

  // ── Internal helpers ───────────────────────────────────────────────────────

  function getClient() {
    if (!global.supabase || !global.supabase.createClient) {
      throw new Error('Supabase client not loaded. Ensure supabase-js is included before auth.js.');
    }
    if (!global._axiomSupabase) {
      if (!global.SUPABASE_URL || !global.SUPABASE_ANON_KEY) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be defined before auth.js loads.');
      }
      global._axiomSupabase = global.supabase.createClient(
        global.SUPABASE_URL,
        global.SUPABASE_ANON_KEY
      );
    }
    return global._axiomSupabase;
  }

  // ── Auth core ──────────────────────────────────────────────────────────────

  /**
   * Sign up a new user. Profile row is created automatically via DB trigger.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user, error}>}
   */
  async function signUp(email, password) {
    const client = getClient();
    const { data, error } = await client.auth.signUp({ email, password });
    return { user: data?.user ?? null, error };
  }

  /**
   * Sign in with email + password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user, session, error}>}
   */
  async function signIn(email, password) {
    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    return { user: data?.user ?? null, session: data?.session ?? null, error };
  }

  /**
   * Sign out the current user and clear local session.
   * @returns {Promise<{error}>}
   */
  async function signOut() {
    const client = getClient();
    const { error } = await client.auth.signOut();
    return { error };
  }

  /**
   * Get the current session. Returns null session if not authenticated.
   * @returns {Promise<{session, user, error}>}
   */
  async function getSession() {
    const client = getClient();
    const { data, error } = await client.auth.getSession();
    return {
      session: data?.session ?? null,
      user:    data?.session?.user ?? null,
      error,
    };
  }

  /**
   * Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
   * Returns the unsubscribe function.
   * @param {function} callback  fn(event, session)
   * @returns {function} unsubscribe
   */
  function onAuthChange(callback) {
    const client = getClient();
    const { data: { subscription } } = client.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }

  // ── Profile ────────────────────────────────────────────────────────────────

  /**
   * Fetch the profiles row for the authenticated user.
   * @returns {Promise<{profile, error}>}
   */
  async function getProfile() {
    const client = getClient();
    const { user, error: sessionError } = await getSession();
    if (sessionError || !user) return { profile: null, error: sessionError ?? new Error('Not authenticated') };

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { profile: data ?? null, error };
  }

  /**
   * Get the current user's tier string (free | pro | fleet_starter | fleet_pro).
   * Falls back to 'free' on any error.
   * @returns {Promise<string>}
   */
  async function getTier() {
    const { profile } = await getProfile();
    return profile?.tier ?? 'free';
  }

  /**
   * Get the limits object for a given tier.
   * @param {string} tier
   * @returns {{ analyses: number, assets: number, aiReport: boolean, fleet: boolean }}
   */
  function getTierLimits(tier) {
    return TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  }

  /**
   * Convenience: get limits for the authenticated user's current tier.
   * @returns {Promise<{ analyses, assets, aiReport, fleet }>}
   */
  async function getCurrentLimits() {
    const tier = await getTier();
    return getTierLimits(tier);
  }

  // ── Usage ──────────────────────────────────────────────────────────────────

  /**
   * Increment analyses_used counter for the authenticated user.
   * Calls the DB function increment_analyses_used().
   * @returns {Promise<{data, error}>}
   */
  async function incrementAnalysesUsed() {
    const client = getClient();
    const { data, error } = await client.rpc('increment_analyses_used');
    return { data, error };
  }

  /**
   * Check whether the authenticated user can run another analysis.
   * Returns true if allowed, false if at limit.
   * @returns {Promise<boolean>}
   */
  async function canRunAnalysis() {
    const { profile } = await getProfile();
    if (!profile) return false;

    const limits = getTierLimits(profile.tier ?? 'free');
    if (limits.analyses === Infinity) return true;
    return (profile.analyses_used ?? 0) < limits.analyses;
  }

  /**
   * Check whether the authenticated user can access AI reports.
   * @returns {Promise<boolean>}
   */
  async function canAccessAIReport() {
    const tier = await getTier();
    return getTierLimits(tier).aiReport;
  }

  /**
   * Check whether the authenticated user can access Fleet features.
   * @returns {Promise<boolean>}
   */
  async function canAccessFleet() {
    const tier = await getTier();
    return getTierLimits(tier).fleet;
  }

  /**
   * Get remaining analyses for free-tier users. Returns null for unlimited tiers.
   * @returns {Promise<number|null>}
   */
  async function remainingAnalyses() {
    const { profile } = await getProfile();
    if (!profile) return 0;
    const limits = getTierLimits(profile.tier ?? 'free');
    if (limits.analyses === Infinity) return null;
    return Math.max(0, limits.analyses - (profile.analyses_used ?? 0));
  }

  // ── Organisation ───────────────────────────────────────────────────────────

  /**
   * Get the organisation_id for the authenticated user.
   * @returns {Promise<string|null>}
   */
  async function getOrgId() {
    const { profile } = await getProfile();
    return profile?.organisation_id ?? null;
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  /**
   * Apply visibility gating to DOM elements based on tier.
   * Elements with data-requires-tier="pro|fleet_starter|fleet_pro|ai_report|fleet"
   * will be shown/hidden based on the current user's tier.
   *
   * Call this after page load once auth state is known.
   *
   * @param {string} tier  current tier string
   */
  function applyTierGating(tier) {
    const limits = getTierLimits(tier);

    document.querySelectorAll('[data-requires-tier]').forEach(el => {
      const requirement = el.getAttribute('data-requires-tier');
      let allowed = false;

      switch (requirement) {
        case 'ai_report':   allowed = limits.aiReport;  break;
        case 'fleet':       allowed = limits.fleet;     break;
        case 'pro':         allowed = (tier !== 'free'); break;
        case 'fleet_starter':
        case 'fleet_pro':   allowed = (tier === requirement || tier === 'fleet_pro'); break;
        default:            allowed = true;
      }

      el.style.display = allowed ? '' : 'none';
    });

    // Elements shown only to unauthenticated / free users
    document.querySelectorAll('[data-hide-when-paid]').forEach(el => {
      el.style.display = (tier === 'free') ? '' : 'none';
    });
  }

  /**
   * Render a tier badge string for display in nav / profile areas.
   * @param {string} tier
   * @returns {string}
   */
  function tierLabel(tier) {
    const labels = {
      free:          'Free',
      pro:           'Pro',
      fleet_starter: 'Fleet Starter',
      fleet_pro:     'Fleet Pro',
    };
    return labels[tier] ?? 'Free';
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  global.AxiomAuth = {
    // Core auth
    signUp,
    signIn,
    signOut,
    getSession,
    onAuthChange,

    // Profile + tier
    getProfile,
    getTier,
    getTierLimits,
    getCurrentLimits,
    getOrgId,

    // Usage gates
    canRunAnalysis,
    canAccessAIReport,
    canAccessFleet,
    incrementAnalysesUsed,
    remainingAnalyses,

    // UI helpers
    applyTierGating,
    tierLabel,

    // Constants
    TIER_LIMITS,
  };

})(window);
