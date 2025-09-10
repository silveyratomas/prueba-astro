// /public/admin.js
(function () {
  const KEY_AUTH = 'tp_auth';
  const KEY_CFG  = 'tp_store_config';

  const defaultConfig = {
    storeName: 'TuTienda',
    themeClass: '',               // '', 'theme-profesional', 'theme-azul', 'theme-naranja-profesional', etc.
    heroImage: '',                // URL completa o /imgs/...
    tagline: 'Catálogo ágil y compra simple',
  };

  // --- AUTH (demo) ---
  function login(email, pass) {
    // DEMO: acepta cualquier cosa no vacía
    if (!email || !pass) throw new Error('Completá email y contraseña');
    localStorage.setItem(KEY_AUTH, JSON.stringify({ email, time: Date.now() }));
    return true;
  }
  function logout() { localStorage.removeItem(KEY_AUTH); }
  function isLogged() { return !!localStorage.getItem(KEY_AUTH); }
  function requireAuth() {
    if (!isLogged()) window.location.href = '/admin/login';
  }

  // --- CONFIG ---
  function getConfig() {
    try {
      const raw = localStorage.getItem(KEY_CFG);
      return raw ? { ...defaultConfig, ...JSON.parse(raw) } : { ...defaultConfig };
    } catch {
      return { ...defaultConfig };
    }
  }
  function saveConfig(cfg) {
    const merged = { ...defaultConfig, ...(cfg || {}) };
    localStorage.setItem(KEY_CFG, JSON.stringify(merged));
    return merged;
  }
  function resetConfig() {
    localStorage.removeItem(KEY_CFG);
    return { ...defaultConfig };
  }

  // --- THEME APPLY (público/tienda) ---
  function applyThemeClass(themeClass) {
    const html = document.documentElement;
    html.className = [...html.classList].filter(c => !c.startsWith('theme-')).join(' ');
    if (themeClass) html.classList.add(themeClass);
  }

  // Exponer en window
  window.tpAdmin = {
    login, logout, isLogged, requireAuth,
    getConfig, saveConfig, resetConfig,
    applyThemeClass,
    defaultConfig
  };
})();
