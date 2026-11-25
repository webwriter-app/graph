/** Whether the node is the host or lies inside it, also through shadow roots. */
export function containsDeep(host: Node, node: Node | null): boolean {
    while (node) {
        if (node === host) return true;
        const root = node.getRootNode();
        node = root instanceof ShadowRoot ? root.host : null;
    }
    return false;
}
