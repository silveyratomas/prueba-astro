(function () {
  // Claves de storage
  const KEY_PUB   = 'tp_cfg';          // publicado
  const KEY_PREV  = 'tp_cfg_preview';  // borrador para vista previa
  const isPreview = new URLSearchParams(location.search).has('preview');

  // Helpers
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
  const loadCfg = () => isPreview ? read(KEY_PREV) : read(KEY_PUB);

  function applyTheme(themeClass) {
    const html = document.documentElement;
    // quitamos clases theme-* previas
    html.className = html.className.split(/\s+/).filter(c => !c.startsWith('theme-')).join(' ').trim();
    if (themeClass) html.classList.add(themeClass);
  }

  function applyHeader(cfg) {
    // si existe un id dedicado, lo usamos; si no, tomamos el último span del link al home
    const brandEl = $('#brandNameHeader') || $('header a[href="/"] span:last-child');
    if (brandEl && cfg.storeName) brandEl.textContent = cfg.storeName;
  }

  function applyFooter(cfg) {
    if (!cfg.footerText) return;
    const foot = $('footer .container');
    if (foot) foot.textContent = cfg.footerText.replace('{year}', String(new Date().getFullYear()));
  }

  function applyHome(cfg) {
    const hero = $('#homeHero');
    if (hero && cfg.heroImage) {
      hero.style.minHeight = '360px';
      hero.style.backgroundImage = `url("${cfg.heroImage}")`;
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';

      const ov = $('#homeHeroOv');
      if (ov) {
        ov.classList.remove('hidden');
        ov.style.background = 'linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.15))';
      }
      // Mejor contraste sobre imagen
      $$('#homeHero .h1, #homeHero p, #homeHero a.btn').forEach(n => n.classList.add('text-white'));
    }

    if (cfg.tagline) {
      const tag = $('#homeTagline');
      if (tag) tag.textContent = cfg.tagline;
    }

    // CTAs: usamos ids si existen y si no tomamos los 3 primeros botones del hero
    const ctas = [
      { t: cfg.cta?.one?.text,   h: cfg.cta?.one?.href,   el: $('#homeCta1') },
      { t: cfg.cta?.two?.text,   h: cfg.cta?.two?.href,   el: $('#homeCta2') },
      { t: cfg.cta?.three?.text, h: cfg.cta?.three?.href, el: $('#homeCta3') },
    ];
    const fallback = $$('#homeHero .mt-6 a');
    ctas.forEach((c, i) => {
      const el = c.el || fallback[i];
      if (!el) return;
      if (c.t) el.textContent = c.t;
      if (c.h) el.setAttribute('href', c.h);
    });
  }

  function applyAll() {
    const cfg = loadCfg();
    // Exponer para páginas que ya leen esta variable
    window.__storeConfig = cfg;
    // Aplicar ajustes live
    applyTheme(cfg.themeClass || '');
    applyHeader(cfg);
    applyHome(cfg);
    applyFooter(cfg);
  }

  document.addEventListener('DOMContentLoaded', applyAll);

  // Si el admin guarda algo en otra pestaña, refrescamos la UI
  window.addEventListener('storage', (e) => {
    if (e.key === KEY_PUB || e.key === KEY_PREV) applyAll();
  });
})();
