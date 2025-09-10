<script src="/admin.js" defer></script>

  // Aplica tema, nombre de tienda y banner del hero sin tocar build-time
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const cfg = tpAdmin.getConfig();

      // Tema (clase en <html>)
      tpAdmin.applyThemeClass(cfg.themeClass || '');

      // Reemplazar nombre de la tienda en el header
      const brandEl = document.querySelector('header a.shrink-0 span:last-child');
      if (brandEl && cfg.storeName) brandEl.textContent = cfg.storeName;

      // Guardado para usar en páginas (ej: index hero)
      window.__storeConfig = cfg;
    } catch {}
  });

