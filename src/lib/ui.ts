export function fmtARS(n: number): string {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(n || 0));
}

export function escapeHtml(s: string): string {
    return String(s || "").replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    } as Record<string, string>)[ch]);
}

export function qs<T extends Element = Element>(sel: string, root: ParentNode = document): T | null {
    return root.querySelector(sel) as T | null;
}

export async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`HTTP ${res.status} – ${txt}`);
    }
    return (await res.json()) as T;
}

export const debounce = <T extends (...args: any[]) => void>(fn: T, ms = 200) => {
    let t: number | undefined;
    return (...args: Parameters<T>) => {
        if (t) window.clearTimeout(t);
        t = window.setTimeout(() => fn(...args), ms);
    };
};
