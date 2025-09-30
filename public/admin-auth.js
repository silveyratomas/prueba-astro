/* public/admin-auth.js */
(() => {
  // Base del API (en dev: 8787). Si querés, podés setear window.__API_BASE__ antes.
  const API = window.__API_BASE__ || 'http://localhost:8787/api';
  const KEY = 'tp_admin_token';

  function setToken(t) { try { localStorage.setItem(KEY, t); } catch {} }
  function getToken()  { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } }
  function clearToken(){ try { localStorage.removeItem(KEY); } catch {} }

  async function api(path, opts = {}) {
    const token = getToken();
    const url = `${API}${path.startsWith('/') ? path : '/' + path}`;
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: opts.body ?? undefined,
      credentials: 'include',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
    }
    if (res.status === 204) return null;
    try { return await res.json(); } catch { return null; }
  }

  async function login(email, password) {
    const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!r?.token) throw new Error('login_failed');
    setToken(r.token);
    return r;
  }

  async function me() { return api('/auth/me'); }

  async function requireAuth() {
    const r = await me();
    if (!r?.user) throw new Error('unauthorized');
    return r.user;
  }

  function isLogged() { return !!getToken(); }
  function logout()   { clearToken(); }

  // API pública
  window.tpAdminAuth = { api, login, me, requireAuth, isLogged, logout };

  // Alias de compatibilidad
  window.tpAdmin = window.tpAdmin || {
    api:        (...a) => window.tpAdminAuth.api(...a),
    isLogged:   (...a) => window.tpAdminAuth.isLogged(...a),
    requireAuth:(...a) => window.tpAdminAuth.requireAuth(...a),
    me:         (...a) => window.tpAdminAuth.me(...a),
    logout:     (...a) => window.tpAdminAuth.logout(...a),
  };
})();
