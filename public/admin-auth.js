/* public/admin-auth.js */
(() => {
  // Base del API (en dev: 8787). Podés sobreescribir con window.__API_BASE__ antes de cargar este script.
  let API = window.__API_BASE__ || 'http://localhost:8787/api';
  const KEY = 'tp_admin_token';

  function setToken(t) { try { localStorage.setItem(KEY, t); } catch { } }
  function getToken() { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } }
  function clearToken() { try { localStorage.removeItem(KEY); } catch { } }

  function normalizeBody(body, headers) {
    if (body == null) return undefined;
    if (typeof body === 'string') return body;
    // si es objeto, serializamos
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    return JSON.stringify(body);
  }

  async function api(path, opts = {}) {
    const token = getToken();
    const url = `${API}${path.startsWith('/') ? path : '/' + path}`;

    const headers = {
      ...(opts.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers,
      body: normalizeBody(opts.body, headers),
      credentials: 'include',
    });

    // Manejo de 401/403: limpiamos sesión y avisamos
    if (res.status === 401 || res.status === 403) {
      clearToken();
      // opcional: redirigir automáticamente si no estamos ya en /admin/login
      try {
        if (!location.pathname.startsWith('/admin/login')) {
          // comentá esta línea si preferís manejar el redirect afuera
          // location.href = '/admin/login';
        }
      } catch { }
      throw new Error('unauthorized');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
    }

    if (res.status === 204) return null;
    // si no hay JSON, devolvemos null
    try { return await res.json(); } catch { return null; }
  }

  async function login(email, password) {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
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
  function logout() { clearToken(); }

  function setBase(newBase) {
    if (typeof newBase === 'string' && newBase.trim()) API = newBase.trim().replace(/\/+$/, '') + '/api';
  }

  // API pública
  window.tpAdminAuth = { api, login, me, requireAuth, isLogged, logout, setBase };

  // Alias de compatibilidad
  window.tpAdmin = window.tpAdmin || {
    api: (...a) => window.tpAdminAuth.api(...a),
    isLogged: (...a) => window.tpAdminAuth.isLogged(...a),
    requireAuth: (...a) => window.tpAdminAuth.requireAuth(...a),
    me: (...a) => window.tpAdminAuth.me(...a),
    logout: (...a) => window.tpAdminAuth.logout(...a),
    setBase: (...a) => window.tpAdminAuth.setBase(...a),
  };
})();
