
// /public/admin.js
(() => {
  const KEY = 'tp_config_v1';

  const DEFAULTS = {
    storeName: 'TuTienda',
    themeClass: '', // '', 'theme-profesional', 'theme-azul', 'theme-naranja-profesional'
    heroImage: '',
    tagline: 'Catálogo ágil y compra simple',
    cta: {
      one:   { text: 'Ver productos',   href: '/listado_box',     show: true },
      two:   { text: 'Listado en tabla',href: '/listado_tablas',  show: true },
      three: { text: 'Ir a comprar',    href: '/comprar',         show: true },
    },
    featured: [],          // array de slugs (ej: ['mate-imperial','termo-acero'])
    showFreeShipping: true,
    footerText: '© {year} TuTienda – Proyecto académico',
    currency: 'ARS'
  };

  function merge(a, b) {
    const r = structuredClone(a);
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) r[k] = merge(r[k] ?? {}, b[k]);
      else r[k] = b[k];
    }
    return r;
  }

  function getConfig() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? merge(DEFAULTS, JSON.parse(raw)) : structuredClone(DEFAULTS);
    } catch {
      return structuredClone(DEFAULTS);
    }
  }

  function saveConfig(cfg) {
    const merged = merge(DEFAULTS, cfg || {});
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  }

  function resetConfig() {
    localStorage.setItem(KEY, JSON.stringify(DEFAULTS));
    return structuredClone(DEFAULTS);
  }

  // --- Auth mínima (placeholder) ---
  const AUTH_KEY = 'tp_admin_auth';
  function isAuthed() { return localStorage.getItem(AUTH_KEY) === '1'; }
  function login()    { localStorage.setItem(AUTH_KEY, '1'); }
  function logout()   { localStorage.removeItem(AUTH_KEY); }
  function requireAuth() {
    // Si no querés cerrojo, comentá esta línea:
    if (!isAuthed() && location.pathname.startsWith('/admin')) login();
  }

  // Helpers UI
  function selectSetValues(selectEl, values=[]) {
    const set = new Set(values);
    [...selectEl.options].forEach(opt => opt.selected = set.has(opt.value));
  }
  function selectGetValues(selectEl) {
    return [...selectEl.selectedOptions].map(o => o.value);
  }

  // Expose
  window.tpAdmin = {
    getConfig, saveConfig, resetConfig,
    requireAuth, login, logout,
    selectSetValues, selectGetValues, DEFAULTS
  };
})();