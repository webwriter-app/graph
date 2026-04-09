import { Selection } from "d3-selection";

export function resetAnimation(
	svg: Selection<Element, unknown, null, undefined>,
	options: {
		nodes?: boolean;
		links?: boolean;
		subtexts?: boolean;
	} = {
		nodes: true,
		links: true,
		subtexts: true,
	},
) {
	let gnode = svg.selectAll("g");
	if (options.nodes) {
		let nodes = gnode.selectAll(".node");
		nodes.attr("fill", "white").attr("stroke-width", 1);
	}
	if (options.links) {
		let links = gnode.selectAll(".link");
		links.attr("stroke", "lightgray");
	}
	if (options.subtexts) {
		let subtexts = gnode.selectAll(".nodesubtext");
		subtexts.text("");
		let nodetexts = gnode.selectAll(".nodetext");
		nodetexts.attr("dy", "0.3em");
	}
}
