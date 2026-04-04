import { Selection, BaseType } from "d3-selection";
import 'd3-transition';

export function setNodeSubTexts(
	svg: Selection<Element, unknown, null, undefined>,
	ids: number[],
	texts: string[],
	signal?: AbortSignal,
) {
	let gnode = svg.selectAll("g");

	const selections: Selection<BaseType, unknown, BaseType, unknown>[] = [];
	const originalDys: string[] = [];

	for (let i = 0; i < ids.length; i++) {
		let id = ids[i];
		let text = texts[i];

		gnode.selectAll(".nodesubtext.n" + id).text(text);

		const nodetext = gnode.selectAll(".nodetext.n" + id);
		selections.push(nodetext);
		originalDys.push(nodetext.attr("dy"));

		nodetext
			.transition()
			.duration(300)
			.attr("dy", text ? "-0.1em" : "0.3em");
	}

	const interrupt = () => selections.forEach((x, i) => {
		x.interrupt().attr("dy", originalDys[i]);
	});
	signal?.addEventListener("abort", interrupt, { once: true });
}
