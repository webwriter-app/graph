import type { AnimationStep, iGraph } from "./types";

type LinkEnds = { source: number; target: number };
type Part = "nodes" | "links" | "subtexts";

/** What the graph shows on top of its structure: colors of nodes and links, and a text under a node. */
export type Visual = {
	nodes: Record<number, string>;
	links: Record<string, string>;
	subtexts: Record<number, string>;
};

export const emptyVisual = (): Visual => ({ nodes: {}, links: {}, subtexts: {} });

/** An edge has no direction here: both orders of its ends give the same key. */
export const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export const sameLink = (a: LinkEnds, b: LinkEnds) => (a.source === b.source && a.target === b.target) || (a.source === b.target && a.target === b.source);

/** Clears the named parts of the visual (all of them by default). */
export function resetVisual(visual: Visual, parts: Partial<Record<Part, boolean>> = { nodes: true, links: true, subtexts: true }): Visual {
	return {
		nodes: parts.nodes ? {} : visual.nodes,
		links: parts.links ? {} : visual.links,
		subtexts: parts.subtexts ? {} : visual.subtexts,
	};
}

/** The visual after a step ran. */
export function playStep(visual: Visual, step: AnimationStep): Visual {
	if (step.type === "reset") return resetVisual(visual, { nodes: step.data?.nodes, links: step.data?.links, subtexts: step.data?.subtexts });
	if (step.type === "node") {
		const nodes = { ...visual.nodes };
		step.data.names.forEach((id, i) => (nodes[id] = step.data.colors[i]));
		return { ...visual, nodes };
	}
	if (step.type === "link") {
		const links = { ...visual.links };
		step.data.links.forEach((link, i) => (links[pairKey(link.source, link.target)] = step.data.colors[i]));
		return { ...visual, links };
	}
	const subtexts = { ...visual.subtexts };
	step.data.nodes.forEach((id, i) => {
		if (step.data.texts[i]) subtexts[id] = step.data.texts[i];
		else delete subtexts[id];
	});
	return { ...visual, subtexts };
}

/** The visual of a step that is being edited: only what the step itself colors, with no transition. */
export function previewStep(visual: Visual, step: AnimationStep): Visual {
	if (step.type === "node") return { ...visual, links: {}, nodes: playStep(emptyVisual(), step).nodes };
	if (step.type === "link") return { ...visual, nodes: {}, links: playStep(emptyVisual(), step).links };
	if (step.type === "subtext") return { ...visual, subtexts: playStep(emptyVisual(), step).subtexts };
	return visual;
}

/** The parts to clear when a step gets selected, before its preview: everything the step does not show itself. */
export const partsOutsideStep = (step: AnimationStep): Record<Part, boolean> => ({ nodes: step.type !== "node", links: step.type !== "link", subtexts: true });

/** A node step with the node added, or removed if it is in it. */
export function toggleStepNode(step: AnimationStep & { type: "node" }, id: number, color: string): AnimationStep {
	const at = step.data.names.indexOf(id);
	if (at === -1) return { ...step, data: { names: [...step.data.names, id], colors: [...step.data.colors, color] } };
	return { ...step, data: { names: step.data.names.filter((_, i) => i !== at), colors: step.data.colors.filter((_, i) => i !== at) } };
}

/** A link step with the link added, or removed if it is in it. */
export function toggleStepLink(step: AnimationStep & { type: "link" }, link: LinkEnds, color: string): AnimationStep {
	const at = step.data.links.findIndex((other) => other.source === link.source && other.target === link.target);
	if (at === -1) return { ...step, data: { links: [...step.data.links, link], colors: [...step.data.colors, color] } };
	return { ...step, data: { links: step.data.links.filter((_, i) => i !== at), colors: step.data.colors.filter((_, i) => i !== at) } };
}

/** The animation without any mention of a deleted node. */
export function withoutNode(animation: AnimationStep[], id: number): AnimationStep[] {
	return animation.map((step) => {
		if (step.type === "node") {
			const keep = step.data.names.map((name) => name !== id);
			return { ...step, data: { names: step.data.names.filter((_, i) => keep[i]), colors: step.data.colors.filter((_, i) => keep[i]) } };
		}
		if (step.type === "link") {
			const keep = step.data.links.map((link) => link.source !== id && link.target !== id);
			return { ...step, data: { links: step.data.links.filter((_, i) => keep[i]), colors: step.data.colors.filter((_, i) => keep[i]) } };
		}
		if (step.type === "subtext") {
			const keep = step.data.nodes.map((node) => node !== id);
			return { ...step, data: { nodes: step.data.nodes.filter((_, i) => keep[i]), texts: step.data.texts.filter((_, i) => keep[i]) } };
		}
		return step;
	});
}

/** The animation without any mention of a deleted link. */
export function withoutLink(animation: AnimationStep[], link: LinkEnds): AnimationStep[] {
	return animation.map((step) => {
		if (step.type !== "link") return step;
		const keep = step.data.links.map((other) => !sameLink(other, link));
		return { ...step, data: { links: step.data.links.filter((_, i) => keep[i]), colors: step.data.colors.filter((_, i) => keep[i]) } };
	});
}

export const firstNodeId = (graph: iGraph): number | null => graph.nodes[0]?.id ?? null;

/** The second node, or the only one: the default target of an algorithm. */
export const secondNodeId = (graph: iGraph): number | null => (graph.nodes[1] ?? graph.nodes[0])?.id ?? null;
