(() => {
    const KEY = 'SHOP_TOKEN';
    // default to local API used in dev (same as admin helper). Overridable via window.__API_BASE__
    const API_BASE = window.__API_BASE__ || 'http://localhost:8787';

    async function jsonFetch(path, opts = {}) {
        const token = localStorage.getItem(KEY);
        const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        let res;
        try {
            res = await fetch(API_BASE + path, { credentials: 'include', headers, ...opts });
        } catch (netErr) {
            const e = new Error('network_error');
            e.cause = netErr;
            throw e;
        }
        if (!res.ok) {
            let err = `HTTP ${res.status}`;
            try { const j = await res.json(); err = j.error || JSON.stringify(j) || err; } catch { }
            const e = new Error(err);
            e.status = res.status;
            throw e;
        }
        return res.json().catch(() => ({}));
    }

    async function register({ email, password, name }) {
        const storeSlug = detectStoreSlug();
        const res = await jsonFetch('/api/shop/auth/register', { method: 'POST', body: JSON.stringify({ storeSlug, email, password, name }) });
        if (res.token) localStorage.setItem(KEY, res.token);
        window.dispatchEvent(new Event('shop:user'));
        return res.customer;
    }
    async function login(email, password) {
        const storeSlug = detectStoreSlug();
        const res = await jsonFetch('/api/shop/auth/login', { method: 'POST', body: JSON.stringify({ storeSlug, email, password }) });
        if (res.token) localStorage.setItem(KEY, res.token);
        window.dispatchEvent(new Event('shop:user'));
        return res.customer;
    }

    // Try to detect current store slug from URL or subdomain. Returns undefined if not found.
    function detectStoreSlug() {
        try {
            const q = new URLSearchParams(window.location.search).get('store');
            if (q) return q;
            const parts = window.location.pathname.split('/').filter(Boolean);
            // pattern /t/:slug
            if (parts[0] === 't' && parts[1]) return parts[1];
            // subdomain like slug.example.com (ignore localhost)
            const host = window.location.hostname || '';
            if (!host.includes('localhost')) {
                const hp = host.split('.');
                if (hp.length > 2 && hp[0] !== 'www') return hp[0];
            }
        } catch (e) {
            // ignore
        }
        return undefined;
    }

    async function me() {
        try {
            const res = await jsonFetch('/api/shop/auth/me');
            return res.customer || null;
        } catch {
            return null;
        }
    }

    async function logout() {
        try { localStorage.removeItem(KEY); } catch { }
        window.dispatchEvent(new Event('shop:user'));
    }

    function getToken() { return localStorage.getItem(KEY); }

    window.shopAuth = { register, login, me, logout, getToken };
})();
