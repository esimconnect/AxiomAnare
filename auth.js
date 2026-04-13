// auth.js — AxiomAnare shared auth module
// Depends on: supabaseClient (initialised in index.html / fleet.html before this script)
// Provides: Auth.signUp, Auth.signIn, Auth.signOut, Auth.getSession,
//           Auth.getTier, Auth.getProfile, Auth.incrementAnalysesUsed
// Modal UI: Auth.openModal(tab), Auth.closeModal()

(function () {
  'use strict';

  // ── Supabase client reference ─────────────────────────────────────────────
  // Both index.html and fleet.html init supabaseClient before loading auth.js
  function db() {
    if (typeof supabaseClient === 'undefined') {
      console.error('auth.js: supabaseClient not initialised before auth.js loaded');
      return null;
    }
    return supabaseClient;
  }

  // ── Core auth functions ───────────────────────────────────────────────────

  async function signUp(email, password) {
    const { data, error } = await db().auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await db().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await db().auth.signOut();
    if (error) throw error;
    _currentProfile = null;
    _onAuthStateChange(null);
  }

  async function getSession() {
    const { data, error } = await db().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  // ── Profile + tier ────────────────────────────────────────────────────────

  let _currentProfile = null;

  async function getProfile(userId) {
    const id = userId || (await getSession())?.user?.id;
    if (!id) return null;
    const { data, error } = await db()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) { console.error('getProfile:', error.message); return null; }
    _currentProfile = data;
    return data;
  }

  async function getTier(userId) {
    const profile = await getProfile(userId);
    return profile?.tier || 'free';
  }

  // Returns the numeric analysis allowance for the current tier
  // 0 = unlimited (paid tiers)
  function tierAnalysisLimit(tier) {
    return tier === 'free' ? 2 : 0;
  }

  async function incrementAnalysesUsed(userId) {
    const id = userId || (await getSession())?.user?.id;
    if (!id) return null;
    // Use the DB function created in schema session
    const { data, error } = await db().rpc('increment_analyses_used', { p_user_id: id });
    if (error) { console.error('incrementAnalysesUsed:', error.message); return null; }
    return data;
  }

  // ── Auth state listener ───────────────────────────────────────────────────

  function _onAuthStateChange(session) {
    _updateNavUI(session);
    // Dispatch custom event so app.js / fleet.js can react
    window.dispatchEvent(new CustomEvent('axiom:authchange', { detail: { session } }));
  }

  db()?.auth.onAuthStateChange((_event, session) => {
    _onAuthStateChange(session);
  });

  // ── Nav UI update ─────────────────────────────────────────────────────────

  function _updateNavUI(session) {
    const loginBtn     = document.getElementById('nav-login-btn');
    const subscribeBtn = document.getElementById('nav-subscribe-btn');
    const userBtn      = document.getElementById('nav-user-btn');
    const userEmail    = document.getElementById('nav-user-email');

    if (!loginBtn) return; // nav not on this page

    if (session?.user) {
      loginBtn.style.display     = 'none';
      subscribeBtn.style.display = 'none';
      if (userBtn)   userBtn.style.display   = 'flex';
      if (userEmail) userEmail.textContent   = session.user.email;
    } else {
      loginBtn.style.display     = '';
      subscribeBtn.style.display = '';
      if (userBtn) userBtn.style.display = 'none';
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  const MODAL_ID  = 'ax-auth-modal';
  const OVERLAY_ID = 'ax-auth-overlay';

  function _buildModal() {
    if (document.getElementById(MODAL_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
      'position:fixed;inset:0;background:rgba(10,14,24,0.82);',
      'backdrop-filter:blur(6px);z-index:9000;display:none;',
      'align-items:center;justify-content:center;'
    ].join('');
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.style.cssText = [
      'background:var(--surface);border:1px solid var(--border2);',
      'border-radius:14px;width:100%;max-width:480px;overflow:hidden;',
      'box-shadow:0 24px 64px rgba(0,0,0,0.6);position:relative;'
    ].join('');

    modal.innerHTML = `
      <!-- Close -->
      <button onclick="Auth.closeModal()" style="position:absolute;top:14px;right:16px;background:none;border:none;cursor:pointer;color:var(--muted);font-size:18px;line-height:1;padding:4px;">&#x2715;</button>

      <!-- Tabs -->
      <div style="display:flex;border-bottom:1px solid var(--border);">
        <button id="ax-tab-login"     class="ax-tab ax-tab-active" onclick="Auth.openModal('login')"    style="${_tabStyle(true)}">Login</button>
        <button id="ax-tab-subscribe" class="ax-tab"               onclick="Auth.openModal('subscribe')" style="${_tabStyle(false)}">Subscribe</button>
      </div>

      <!-- LOGIN PANEL -->
      <div id="ax-panel-login" style="padding:28px 32px 24px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;margin-bottom:18px;letter-spacing:0.3px;">Sign in to AxiomAnare</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="${_labelStyle()}">Email</div>
            <input id="ax-login-email" type="email" placeholder="engineer@company.com" style="${_inputStyle()}" autocomplete="email">
          </div>
          <div>
            <div style="${_labelStyle()}">Password</div>
            <input id="ax-login-password" type="password" placeholder="••••••••" style="${_inputStyle()}" autocomplete="current-password">
          </div>
          <div id="ax-login-error" style="display:none;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--red);padding:8px 10px;background:rgba(231,76,60,0.07);border:1px solid rgba(231,76,60,0.25);border-radius:6px;"></div>
          <button id="ax-login-btn" onclick="Auth._doLogin()" style="${_primaryBtnStyle()}">Sign In</button>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);text-align:center;">
            No account? <a href="#" onclick="Auth.openModal('subscribe');return false;" style="color:var(--accent);text-decoration:none;">Subscribe to a plan</a>
          </div>
        </div>
      </div>

      <!-- SUBSCRIBE PANEL -->
      <div id="ax-panel-subscribe" style="display:none;padding:28px 32px 24px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;margin-bottom:6px;letter-spacing:0.3px;">Create your account</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:18px;line-height:1.5;">Select a plan, enter your details, and proceed to payment.</div>

        <!-- Tier cards -->
        <div id="ax-tier-cards" style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px;">
          ${_tierCard('pro',     'Pro',           '$49',  '/month', 'Unlimited analyses · Full AI report',         false)}
          ${_tierCard('fleet_starter', 'Fleet Starter', '$99',  '/month', 'Up to 10 assets · Fleet dashboard · AI report', false)}
          ${_tierCard('fleet_pro',     'Fleet Pro',     '$299', '/month', 'Up to 30 assets · Priority support',          false)}
        </div>

        <!-- Email + password -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="${_labelStyle()}">Email</div>
            <input id="ax-signup-email" type="email" placeholder="engineer@company.com" style="${_inputStyle()}" autocomplete="email">
          </div>
          <div>
            <div style="${_labelStyle()}">Password <span style="font-size:9px;color:var(--muted);margin-left:6px;">min. 8 characters</span></div>
            <input id="ax-signup-password" type="password" placeholder="••••••••" style="${_inputStyle()}" autocomplete="new-password">
          </div>
          <div id="ax-signup-error" style="display:none;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--red);padding:8px 10px;background:rgba(231,76,60,0.07);border:1px solid rgba(231,76,60,0.25);border-radius:6px;"></div>
          <button id="ax-signup-btn" onclick="Auth._doSignup()" style="${_primaryBtnStyle()}">Continue to Payment</button>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);text-align:center;line-height:1.5;">
            Already have an account? <a href="#" onclick="Auth.openModal('login');return false;" style="color:var(--accent);text-decoration:none;">Sign in</a>
          </div>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Keyboard: Escape closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // Enter submits active panel
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      const overlay = document.getElementById(OVERLAY_ID);
      if (!overlay || overlay.style.display === 'none') return;
      const loginPanel = document.getElementById('ax-panel-login');
      if (loginPanel && loginPanel.style.display !== 'none') Auth._doLogin();
      else Auth._doSignup();
    });
  }

  function _tabStyle(active) {
    return [
      'flex:1;padding:13px;background:none;border:none;cursor:pointer;',
      'font-family:"IBM Plex Mono",monospace;font-size:11px;font-weight:600;',
      'letter-spacing:0.5px;transition:all 0.15s;',
      active
        ? 'color:var(--accent);border-bottom:2px solid var(--accent);'
        : 'color:var(--muted);border-bottom:2px solid transparent;'
    ].join('');
  }

  function _labelStyle() {
    return 'font-family:"IBM Plex Mono",monospace;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;';
  }

  function _inputStyle() {
    return [
      'width:100%;background:var(--surface2);border:1px solid var(--border);',
      'border-radius:7px;padding:9px 12px;font-family:"IBM Plex Mono",monospace;',
      'font-size:12px;color:var(--text);outline:none;',
      'transition:border-color 0.2s;'
    ].join('');
  }

  function _primaryBtnStyle() {
    return [
      'width:100%;padding:12px;background:var(--accent);color:#fff;border:none;',
      'border-radius:8px;font-family:"Barlow Condensed",sans-serif;font-size:16px;',
      'font-weight:700;cursor:pointer;letter-spacing:0.5px;transition:all 0.2s;',
      'margin-top:4px;'
    ].join('');
  }

  function _tierCard(id, name, price, period, desc, selected) {
    const sel = selected ? 'border-color:var(--accent);background:rgba(77,157,224,0.1);' : '';
    return `
      <label id="ax-tier-${id}" style="display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all 0.15s;${sel}" onclick="Auth._selectTier('${id}')">
        <div style="width:14px;height:14px;border-radius:50%;border:1.5px solid var(--border2);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;" id="ax-tier-radio-${id}">${selected ? '&#9679;' : ''}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.3px;">${name}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px;">${desc}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:var(--accent);">${price}</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);">${period}</span>
        </div>
      </label>`;
  }

  let _selectedTier = 'pro';

  function _selectTier(tier) {
    _selectedTier = tier;
    ['pro', 'fleet_starter', 'fleet_pro'].forEach(function (t) {
      const card  = document.getElementById('ax-tier-' + t);
      const radio = document.getElementById('ax-tier-radio-' + t);
      if (!card) return;
      if (t === tier) {
        card.style.borderColor = 'var(--accent)';
        card.style.background  = 'rgba(77,157,224,0.1)';
        if (radio) radio.innerHTML = '&#9679;';
      } else {
        card.style.borderColor = 'var(--border)';
        card.style.background  = '';
        if (radio) radio.innerHTML = '';
      }
    });
  }

  // ── Modal open / close ─────────────────────────────────────────────────────

  function openModal(tab) {
    _buildModal();
    tab = tab || 'login';

    const overlay = document.getElementById(OVERLAY_ID);
    const loginPanel = document.getElementById('ax-panel-login');
    const subPanel   = document.getElementById('ax-panel-subscribe');
    const tabLogin   = document.getElementById('ax-tab-login');
    const tabSub     = document.getElementById('ax-tab-subscribe');

    if (!overlay) return;

    // Reset errors
    ['ax-login-error', 'ax-signup-error'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.textContent = ''; }
    });

    if (tab === 'login') {
      loginPanel.style.display = '';
      subPanel.style.display   = 'none';
      tabLogin.style.cssText   = _tabStyle(true);
      tabSub.style.cssText     = _tabStyle(false);
      setTimeout(function () {
        const el = document.getElementById('ax-login-email');
        if (el) el.focus();
      }, 80);
    } else {
      loginPanel.style.display = 'none';
      subPanel.style.display   = '';
      tabLogin.style.cssText   = _tabStyle(false);
      tabSub.style.cssText     = _tabStyle(true);
      // Default select Pro tier
      _selectTier(_selectedTier || 'pro');
      setTimeout(function () {
        const el = document.getElementById('ax-signup-email');
        if (el) el.focus();
      }, 80);
    }

    overlay.style.display        = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ── Login action ──────────────────────────────────────────────────────────

  async function _doLogin() {
    const email    = (document.getElementById('ax-login-email')?.value    || '').trim();
    const password = (document.getElementById('ax-login-password')?.value || '').trim();
    const errEl    = document.getElementById('ax-login-error');
    const btn      = document.getElementById('ax-login-btn');

    _clearError(errEl);

    if (!email || !password) { _showError(errEl, 'Email and password are required.'); return; }

    _setLoading(btn, 'Signing in…');
    try {
      await signIn(email, password);
      closeModal();
    } catch (err) {
      _showError(errEl, _friendlyError(err.message));
    } finally {
      _setLoading(btn, 'Sign In', false);
    }
  }

  // ── Signup action ─────────────────────────────────────────────────────────

  async function _doSignup() {
    const email    = (document.getElementById('ax-signup-email')?.value    || '').trim();
    const password = (document.getElementById('ax-signup-password')?.value || '').trim();
    const errEl    = document.getElementById('ax-signup-error');
    const btn      = document.getElementById('ax-signup-btn');

    _clearError(errEl);

    if (!email)          { _showError(errEl, 'Email is required.'); return; }
    if (!_validEmail(email)) { _showError(errEl, 'Enter a valid email address.'); return; }
    if (password.length < 8) { _showError(errEl, 'Password must be at least 8 characters.'); return; }

    _setLoading(btn, 'Creating account…');
    try {
      await signUp(email, password);
      // Account created — Stripe checkout will be wired in the Payments session
      // For now, show confirmation and close
      _showSignupSuccess(email);
    } catch (err) {
      _showError(errEl, _friendlyError(err.message));
    } finally {
      _setLoading(btn, 'Continue to Payment', false);
    }
  }

  function _showSignupSuccess(email) {
    const panel = document.getElementById('ax-panel-subscribe');
    if (!panel) return;
    panel.innerHTML = `
      <div style="text-align:center;padding:12px 0 8px;">
        <div style="font-size:32px;margin-bottom:14px;">&#10003;</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;margin-bottom:8px;">Account created</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:18px;">
          A confirmation email has been sent to<br>
          <span style="color:var(--accent);">${email}</span><br><br>
          Payment integration coming shortly — you will be directed<br>
          to Stripe checkout to activate your subscription.
        </div>
        <button onclick="Auth.closeModal()" style="${_primaryBtnStyle()}">Close</button>
      </div>`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _showError(el, msg) {
    if (!el) return;
    el.textContent    = msg;
    el.style.display  = 'block';
  }

  function _clearError(el) {
    if (!el) return;
    el.textContent   = '';
    el.style.display = 'none';
  }

  function _setLoading(btn, label, loading) {
    if (!btn) return;
    if (loading === false) {
      btn.textContent = label;
      btn.disabled    = false;
      btn.style.opacity = '1';
    } else {
      btn.textContent = label;
      btn.disabled    = true;
      btn.style.opacity = '0.7';
    }
  }

  function _validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function _friendlyError(msg) {
    if (!msg) return 'An error occurred. Please try again.';
    if (/invalid.*credentials|invalid login/i.test(msg))   return 'Incorrect email or password.';
    if (/email.*already.*registered|already.*exists/i.test(msg)) return 'An account with this email already exists.';
    if (/password.*short|password.*length/i.test(msg))     return 'Password must be at least 8 characters.';
    if (/rate.limit/i.test(msg))                           return 'Too many attempts. Please wait a moment and try again.';
    return msg;
  }

  // ── Nav wire-up (called once DOM is ready) ────────────────────────────────

  function _wireNav() {
    const loginBtn = document.getElementById('nav-login-btn');
    const subBtn   = document.getElementById('nav-subscribe-btn');
    if (loginBtn) loginBtn.addEventListener('click', function (e) { e.preventDefault(); openModal('login'); });
    if (subBtn)   subBtn.addEventListener('click',   function (e) { e.preventDefault(); openModal('subscribe'); });

    // Restore nav UI from existing session on page load
    getSession().then(function (session) {
      _updateNavUI(session);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _wireNav);
  } else {
    _wireNav();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.Auth = {
    signUp,
    signIn,
    signOut,
    getSession,
    getTier,
    getProfile,
    incrementAnalysesUsed,
    tierAnalysisLimit,
    openModal,
    closeModal,
    _doLogin,
    _doSignup,
    _selectTier
  };

})();
