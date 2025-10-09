export type Category = { id: string; name: string; slug: string; parentId?: string | null; isOffer?: boolean };
export type CategoryNode = Category & { children: CategoryNode[] };

export function buildTree(flat: Category[]): CategoryNode[] {
    const byId = new Map<string, CategoryNode>();
    flat.forEach((c) => byId.set(c.id, { ...c, children: [] }));
    const roots: CategoryNode[] = [];
    for (const node of byId.values()) {
        if (node.parentId) {
            const p = byId.get(node.parentId);
            if (p) p.children.push(node);
            else roots.push(node);
        } else roots.push(node);
    }
    const sortRec = (arr: CategoryNode[]) => {
        arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        arr.forEach((n) => sortRec(n.children));
    };
    sortRec(roots);
    return roots;
}
