(() => {
  async function jsonFetch(path, opts = {}) {
    const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
    if (!res.ok) {
      let err = 'error';
      try { const j = await res.json(); err = j.error || JSON.stringify(j); } catch { }
      const e = new Error(err);
      e.status = res.status;
      throw e;
    }
    return res.json().catch(() => ({}));
  }

  async function register(data) {
    const res = await jsonFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
    try {
      // save a short-lived cached copy so pages can show immediate UI
      sessionStorage.setItem('tp_user', JSON.stringify(res.user || {}));
    } catch { }
    window.dispatchEvent(new Event('tpuser'));
    return res.user;
  }

  async function login(email, password) {
    const res = await jsonFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    try {
      sessionStorage.setItem('tp_user', JSON.stringify(res.user || {}));
    } catch { }
    window.dispatchEvent(new Event('tpuser'));
    return res.user;
  }

  async function me() {
    try {
      const res = await jsonFetch('/api/auth/me');
      try { sessionStorage.setItem('tp_user', JSON.stringify(res.user || {})); } catch { }
      return res.user || null;
    } catch {
      try { sessionStorage.removeItem('tp_user'); } catch { }
      return null;
    }
  }

  async function logout() {
    try {
      await jsonFetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    try { sessionStorage.removeItem('tp_user'); } catch { }
    window.dispatchEvent(new Event('tpuser'));
  }

  async function isLogged() { return !!(await me()); }

  window.tpUser = { register, login, me, logout, isLogged };
})();
