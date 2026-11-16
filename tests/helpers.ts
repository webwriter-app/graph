import "../src/widgets/ww-graph";

export const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export async function until<T>(fn: () => T | Promise<T>, what: string, ms = 20000): Promise<NonNullable<T>> {
  const end = performance.now() + ms;
  for (;;) {
    let value: T | false;
    try { value = await fn(); } catch { value = false; }
    if (value) return value as NonNullable<T>;
    if (performance.now() > end) throw new Error("timed out waiting for " + what);
    await frame();
  }
}

export const data = {
  graph: { nodes: [{ id: 0, name: "A" }, { id: 1, name: "B" }, { id: 2, name: "C" }], links: [{ source: 0, target: 1, weight: 2 }, { source: 1, target: 2, weight: 3 }] },
  animation: [] as any[],
  permissions: { general: { play: true, playbackRate: true }, edit: { enabled: true, addNode: true, addEdge: true, editNode: true, editEdge: true, delNode: true, delEdge: true }, algorithm: { enabled: true, executable: ["bfs", "dfs", "dijkstra"] }, animation: { enabled: true, editStep: true, delStep: true } },
};

export function holder(): HTMLElement {
  let element = document.getElementById("mount");
  if (!element) {
    element = document.createElement("div");
    element.id = "mount";
    document.body.append(element);
  }
  return element;
}

export function cleanup() {
  document.designMode = "off";
  document.getElementById("mount")?.remove();
}

export async function mount(attrs = "", block: unknown = data): Promise<any> {
  const root = holder();
  root.innerHTML = `<ww-graph ${attrs} style="width:700px"><script type="application/json" slot="data">${JSON.stringify(block)}</script></ww-graph>`;
  const el = root.firstElementChild as any;
  await until(() => el.shadowRoot && el.shadowRoot.querySelector("display-graph"), "render");
  return el;
}

export const blockOf = (el: Element) => el.querySelector(':scope > script[type="application/json"][slot="data"]') as HTMLScriptElement;
export const topBar = (el: any) => el.shadowRoot.querySelector("top-bar");
export const view = (el: any) => el.shadowRoot.querySelector("display-graph");
export const scene = (el: any) => view(el).shadowRoot.querySelector("ww-scene");
export const node = (el: any, id: number | string) => view(el).shadowRoot.querySelector(`ww-node[data-ww-key="${id}"]`);
export const edge = (el: any, key: string) => view(el).shadowRoot.querySelector(`ww-path[data-ww-key="${key}"]`);
export const disc = (el: any, id: number) => node(el, id).querySelector(".disc");

export const centre = (element: Element) => {
  const r = element.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

export const pointer = (target: Element, type: string, at: { x: number; y: number }) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerId: 7, button: 0, isPrimary: true, clientX: at.x, clientY: at.y }));

export async function click(target: Element) {
  const at = centre(target);
  pointer(target, "pointerdown", at);
  pointer(target, "pointerup", at);
  await frame(); await frame();
}

export async function drag(target: Element, dx: number, dy: number) {
  const from = centre(target);
  pointer(target, "pointerdown", from);
  pointer(target, "pointermove", { x: from.x + 6, y: from.y + 6 });
  await frame(); await frame();
  pointer(target, "pointermove", { x: from.x + dx, y: from.y + dy });
  await frame(); await frame();
  pointer(target, "pointerup", { x: from.x + dx, y: from.y + dy });
  await frame(); await frame();
}

export const laidOut = (el: any, count = 3) =>
  until(() => view(el).shadowRoot.querySelectorAll("ww-node").length === count
    && [...view(el).shadowRoot.querySelectorAll("ww-node")].every((n: any) => n.hasAttribute("x"))
    && node(el, 0).getBoundingClientRect().width > 0, "nodes laid out");
