import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import type { iGraph, Positions } from "./types";

export const NODE_RADIUS = 32;
const PADDING = 64;
const LINK_DISTANCE = 150;

type Body = SimulationNodeDatum & { id: number };

/**
 * Places the nodes with a force layout that is run until it settles. Nodes that
 * already have a position start there and only adjust; new nodes start in the middle.
 * Pinned nodes stay where they are; `ticks` limits the steps for a layout that follows a drag.
 */
export function layoutGraph(graph: iGraph, width: number, height: number, previous?: Positions, options: { pinned?: Set<number>; ticks?: number } = {}): Positions {
	const bodies: Body[] = graph.nodes.map((node, index) => {
		const known = previous?.get(node.id);
		if (known) return options.pinned?.has(node.id) ? { id: node.id, x: known.x, y: known.y, fx: known.x, fy: known.y } : { id: node.id, x: known.x, y: known.y, vx: 0, vy: 0 };
		// Without any previous layout d3 spreads the nodes in a spiral by itself.
		return previous?.size ? { id: node.id, x: width / 2 + index, y: height / 2 + index } : { id: node.id };
	});
	const ids = new Set(bodies.map((body) => body.id));
	const links: SimulationLinkDatum<Body>[] = graph.links
		.filter((link) => ids.has(link.source) && ids.has(link.target))
		.map((link) => ({ source: link.source, target: link.target }));

	const keepInside = () => {
		for (const body of bodies) {
			const { x = 0, y = 0 } = body;
			body.vx! += Math.max(0, PADDING - x) - Math.max(0, x - (width - PADDING));
			body.vy! += Math.max(0, PADDING - y) - Math.max(0, y - (height - PADDING));
		}
	};

	const simulation = forceSimulation(bodies)
		.force("charge", forceManyBody().strength(-500))
		.force("center", forceCenter(width / 2, height / 2))
		.force("collision", forceCollide(NODE_RADIUS))
		.force("link", forceLink<Body, SimulationLinkDatum<Body>>(links).id((body) => body.id).distance(LINK_DISTANCE))
		.force("boundary", keepInside)
		.stop();
	if (previous?.size) simulation.alpha(0.3);

	const ticks = Math.ceil(Math.log(simulation.alphaMin() / simulation.alpha()) / Math.log(1 - simulation.alphaDecay()));
	simulation.tick(Math.min(ticks, options.ticks ?? Infinity));
	return new Map(bodies.map((body) => [body.id, { x: body.x ?? width / 2, y: body.y ?? height / 2 }]));
}
