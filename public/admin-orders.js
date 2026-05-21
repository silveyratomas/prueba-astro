(function () {
    const $ = (s) => document.querySelector(s);

    function fmt(n) {
        try {
            return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(n || 0));
        } catch {
            return n;
        }
    }

    function formatDate(d) {
        if (!d) return '-';
        return new Date(d).toLocaleString('es-AR');
    }

    async function __guard() {
        const m = await tpAdminAuth.me();
        if (!m?.user) location.href = '/admin/login';
        return m.user;
    }

    async function __loadOrders() {
        await __guard();
        const store = ($('#storeFilter')?.value || 'mi-tienda-demo').trim();
        const rows = $('#orderRows');

        try {
            rows.innerHTML = `<tr><td colspan="8" class="py-4 text-[var(--muted)]">Cargando…</td></tr>`;
            const res = await tpAdminAuth.api(`/orders?store=${encodeURIComponent(store)}`);
            const list = Array.isArray(res?.orders) ? res.orders : [];

            if (!list.length) {
                rows.innerHTML = `<tr><td colspan="8" class="py-4 text-[var(--muted)]">No hay órdenes.</td></tr>`;
                return;
            }

            rows.innerHTML = list.map(o => {
                const itemsSummary = o.items.map(i => `${i.qty}x ${i.titleSnapshot}`).join(', ');
                const paymentStatus = o.payments?.[0]?.status || 'PENDING';
                const shippingStatus = o.shippingInfo?.status || '-';

                // Selectores de estado
                const statusOptions = ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'].map(s =>
                    `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`
                ).join('');

                const shipOptions = ['PENDING', 'LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map(s =>
                    `<option value="${s}" ${shippingStatus === s ? 'selected' : ''}>${s}</option>`
                ).join('');

                const shipSelect = o.shippingInfo
                    ? `<select class="text-xs border rounded p-1" onchange="__updateShipStatus('${o.id}', this.value)">${shipOptions}</select>`
                    : '<span class="text-xs text-[var(--muted)]">Retiro</span>';

                return `
          <tr class="border-b border-[var(--card-border)] hover:bg-[var(--card-border)]/10">
            <td class="py-3 pr-3">
                <div class="font-mono text-xs text-[var(--muted)]">${o.id.slice(-6)}</div>
                <div class="text-xs">${formatDate(o.createdAt)}</div>
            </td>
            <td class="py-3 pr-3">
                <div class="font-medium text-sm">${o.user?.name || 'Invitado'}</div>
                <div class="text-xs text-[var(--muted)]">${o.user?.email || ''}</div>
            </td>
            <td class="py-3 pr-3">
                <div class="text-xs max-w-[200px] truncate" title="${itemsSummary}">${itemsSummary}</div>
            </td>
            <td class="py-3 pr-3 text-right font-medium">${fmt(o.total)}</td>
            <td class="py-3 pr-3 text-center">
                <span class="text-xs px-2 py-1 rounded-full ${paymentStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${paymentStatus}</span>
            </td>
            <td class="py-3 pr-3 text-center">
                <select class="text-xs border rounded p-1" onchange="__updateOrderStatus('${o.id}', this.value)">
                    ${statusOptions}
                </select>
            </td>
            <td class="py-3 pr-3 text-center">
                ${shipSelect}
            </td>
            <td class="py-3 pr-3 text-right">
                <button class="btn-outline text-xs" onclick="alert('Detalle completo pronto...')">Ver</button>
            </td>
          </tr>
        `;
            }).join('');

        } catch (e) {
            console.error(e);
            rows.innerHTML = `<tr><td colspan="8" class="py-4 text-red-600">Error al cargar órdenes.</td></tr>`;
        }
    }

    async function __updateOrderStatus(id, status) {
        try {
            await tpAdminAuth.api(`/orders/${id}`, { method: 'PATCH', body: { status } });
            // toast('Estado actualizado');
        } catch (e) {
            console.error(e);
            alert('Error al actualizar estado');
        }
    }

    async function __updateShipStatus(id, shippingStatus) {
        try {
            await tpAdminAuth.api(`/orders/${id}`, { method: 'PATCH', body: { shippingStatus } });
            // toast('Envío actualizado');
        } catch (e) {
            console.error(e);
            alert('Error al actualizar envío');
        }
    }

    window.__loadOrders = __loadOrders;
    window.__updateOrderStatus = __updateOrderStatus;
    window.__updateShipStatus = __updateShipStatus;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', __loadOrders);
    else __loadOrders();

})();
