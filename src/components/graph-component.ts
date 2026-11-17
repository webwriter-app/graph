import { LitElementWw } from "@webwriter/lit";
import { SceneController } from "@webwriter/lit/scene";
import { Scene, sceneElements, webglAvailable, type ActivateDetail, type ConnectDetail, type MovingDetail, type MoveDetail } from "@webwriter/widget/scene";
import { PixiScene } from "@webwriter/widget/scene/pixi";
import { css, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { emptyVisual, pairKey, type Visual } from "../model/animation";
import { layoutGraph, NODE_RADIUS } from "../model/layout";
import type { iGraph, Positions } from "../model/types";

const PULSE = [{ scale: 1 }, { scale: 0.3125, offset: 0.5 }, { scale: 1 }];
const PULSE_MS = 800;
const LIVE_TICKS = 12;

const linkKey = (link: { source: number; target: number }) => `${link.source}-${link.target}`;

/** Draws the graph on a Scene: a node is HTML, an edge a path between two nodes, and the layout is a function of the graph. */
export class Graph extends LitElementWw {
	// Where the browser has no WebGL the same template is drawn with SVG.
	static scopedElements: Record<string, CustomElementConstructor> = { ...sceneElements, "ww-scene": webglAvailable() ? PixiScene : Scene };

	static styles = css`
		:host {
			display: block;
			width: 100%;
			line-height: 0;
		}
		ww-scene {
			display: block;
			width: 100%;
			outline: none;
			-webkit-user-select: none;
			user-select: none;
			-webkit-tap-highlight-color: transparent;
		}
		ww-scene:has(ww-path:state(hover)) {
			cursor: var(--link-cursor, default);
		}
		ww-path {
			stroke: var(--edge, lightgray);
			stroke-width: 8px;
		}
		ww-path[selected] {
			stroke: var(--sl-color-primary-300);
		}
		ww-scene::part(link) {
			stroke: lightgreen;
			stroke-width: 8px;
		}
		ww-path ww-text {
			fill: black;
			font-size: 16px;
			background-color: white;
			padding: 0 3px;
		}
		ww-node {
			cursor: var(--node-cursor, default);
			outline: none;
		}
		.disc {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
			width: 100%;
			height: 100%;
			border: 1px solid black;
			border-radius: 50%;
			background: var(--fill, white);
			color: black;
			font-size: 16px;
			line-height: 1.2;
			white-space: nowrap;
			transition: background-color 0.4s, transform 0.15s;
		}
		.disc:hover {
			transform: scale(1.0625);
		}
		ww-node[selected] .disc {
			background: var(--sl-color-primary-300);
			border-width: 2px;
		}
		ww-node:focus-visible .disc {
			outline: 2px solid var(--sl-color-primary-600);
			outline-offset: 2px;
		}
	`;

	readonly #scene = new SceneController(this);

	@property({ type: Number }) accessor height: number = 600;
	@property({ type: Object }) accessor graph: iGraph = { nodes: [], links: [] };
	@property({ type: Object }) accessor visual: Visual = emptyVisual();
	@property({ type: Number }) accessor highlightedNode: number | null = null;
	@property({ type: Object }) accessor highlightedLink: { source: number; target: number } | null = null;
	@property({ type: Boolean }) accessor addingEdge = false;
	@property({ type: String }) accessor nodeCursorMode: "default" | "crosshair" = "default";
	@property({ type: String }) accessor linkCursorMode: "default" | "crosshair" = "default";

	@state() private accessor width = 0;
	@state() private accessor positions: Positions = new Map();

	#structure = "";
	#resizeObserver: ResizeObserver | null = null;
	#pulses = new Set<Animation>();
	#beforeMove: Positions | null = null;

	override connectedCallback() {
		super.connectedCallback();
		this.#resizeObserver = new ResizeObserver((entries) => {
			const width = Math.floor(entries[0].contentRect.width);
			if (width > 0 && width !== this.width) this.width = width;
		});
		this.#resizeObserver.observe(this);
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.cancelPulses();
	}

	protected override willUpdate(changed: Map<PropertyKey, unknown>) {
		if (!this.width) return;
		// Positions follow the structure of the graph and the size of the scene; a rename or a new weight keeps them.
		const resized = changed.has("width") || changed.has("height");
		if (!resized && !changed.has("graph")) return;
		const structure = `${this.graph.nodes.map((node) => node.id)}|${this.graph.links.map(linkKey)}`;
		if (resized || structure !== this.#structure) {
			this.#structure = structure;
			this.positions = layoutGraph(this.graph, this.width, this.height, this.positions);
		}
	}

	/** Lays the nodes out again from scratch. */
	relayout() {
		if (this.width) this.positions = layoutGraph(this.graph, this.width, this.height);
	}

	/** Makes the nodes shrink and grow back once. */
	pulse(ids: number[]) {
		for (const id of ids) {
			const disc = this.renderRoot.querySelector(`ww-node[data-ww-key="${id}"] .disc`);
			if (!disc) continue;
			const animation = disc.animate(PULSE, PULSE_MS);
			this.#pulses.add(animation);
			animation.onfinish = animation.oncancel = () => this.#pulses.delete(animation);
		}
	}

	cancelPulses() {
		for (const animation of this.#pulses) animation.cancel();
		this.#pulses.clear();
	}

	/** Every click on a node or an edge, also on one that is selected already. */
	#activate(event: CustomEvent<ActivateDetail>) {
		const key = event.detail.key;
		let detail: { type: string; id?: number; source?: number; target?: number } = { type: "NONE" };
		if (/^\d+$/.test(key)) detail = { type: "NODE", id: Number(key) };
		else {
			const link = this.graph.links.find((other) => linkKey(other) === key);
			if (link) detail = { type: "LINK", source: link.source, target: link.target };
		}
		this.dispatchEvent(new CustomEvent("graph-pick", { bubbles: true, composed: true, detail }));
	}

	#background() {
		this.dispatchEvent(new CustomEvent("graph-pick", { bubbles: true, composed: true, detail: { type: "NONE" } }));
	}

	#connect(event: CustomEvent<ConnectDetail>) {
		const source = Number(event.detail.from);
		const target = Number(event.detail.to);
		if (Number.isNaN(source) || Number.isNaN(target) || source === target) return;
		this.dispatchEvent(new CustomEvent("graph-connect", { bubbles: true, composed: true, detail: { source, target } }));
	}

	#nodePositions(items: MoveDetail["items"], into: Positions) {
		for (const { key, x, y } of items) {
			if (/^\d+$/.test(key)) into.set(Number(key), { x: x + NODE_RADIUS, y: y + NODE_RADIUS });
		}
		return into;
	}

	/** The other nodes react while one is dragged; a move that is cancelled puts everything back. */
	#moving(event: CustomEvent<MovingDetail>) {
		const { state, committed, items } = event.detail;
		if (state === "end") {
			if (!committed && this.#beforeMove) this.positions = this.#beforeMove;
			this.#beforeMove = null;
			return;
		}
		this.#beforeMove ??= this.positions;
		const held = this.#nodePositions(items, new Map());
		const next = layoutGraph(this.graph, this.width, this.height, new Map([...this.positions, ...held]), { pinned: new Set(held.keys()), ticks: LIVE_TICKS });
		// The attributes of a node that is held stay as they are: the scene adds its preview to them.
		for (const id of held.keys()) next.set(id, this.positions.get(id)!);
		this.positions = next;
	}

	#move(event: CustomEvent<MoveDetail>) {
		this.positions = this.#nodePositions(event.detail.items, new Map(this.positions));
	}

	render() {
		const { nodes, links } = this.graph;
		const { positions, visual } = this;
		return html`
			<ww-scene
				select="single"
				?connect-click=${this.addingEdge}
				style="height: ${this.height}px; --node-cursor: ${this.nodeCursorMode}; --link-cursor: ${this.linkCursorMode}"
				@ww-activate=${this.#activate}
				@ww-background=${this.#background}
				@ww-connect=${this.#connect}
				@ww-moving=${this.#moving}
				@ww-move=${this.#move}
			>
				${links.map((link) => {
					const selected = this.highlightedLink !== null && pairKey(this.highlightedLink.source, this.highlightedLink.target) === pairKey(link.source, link.target);
					return html`<ww-path data-ww-key=${linkKey(link)} from=${link.source} to=${link.target} selectable ?selected=${selected} style=${visual.links[pairKey(link.source, link.target)] ? `--edge: ${visual.links[pairKey(link.source, link.target)]}` : nothing}><ww-text at="middle" side="on">${link.weight}</ww-text></ww-path>`;
				})}
				${repeat(
					nodes.filter((node) => positions.has(node.id)),
					(node) => node.id,
					(node) => html`
						<ww-node
							data-ww-key=${node.id}
							x=${positions.get(node.id)!.x - NODE_RADIUS}
							y=${positions.get(node.id)!.y - NODE_RADIUS}
							width=${2 * NODE_RADIUS}
							height=${2 * NODE_RADIUS}
							selectable
							movable
							data-ww-link=${this.addingEdge ? "link" : nothing}
							data-ww-accept=${this.addingEdge ? "link" : nothing}
							?selected=${this.highlightedNode === node.id}
						>
							<div class="disc" style=${visual.nodes[node.id] ? `--fill: ${visual.nodes[node.id]}` : nothing}>
								<span>${node.name}</span>
								${visual.subtexts[node.id] ? html`<span>${visual.subtexts[node.id]}</span>` : nothing}
							</div>
						</ww-node>
					`,
				)}
			</ww-scene>
		`;
	}
}
