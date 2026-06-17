import { delay } from "../utils/sleep";
import { Selection, BaseType } from "d3-selection";
import 'd3-transition';

const transition_speed = 300;

export async function setNodeSubTexts(
	svg: Selection<Element, unknown, null, undefined>,
	ids: number[],
	texts: string[],
	signal?: AbortSignal,
) {
	let gnode = svg.selectAll("g");

	const nodetextSelections: Selection<BaseType, unknown, BaseType, unknown>[] = [];
	const subtextSelections: Selection<BaseType, unknown, BaseType, unknown>[] = [];
	const originalDys: string[] = [];
	const originalSubtexts: string[] = [];

	for (let i = 0; i < ids.length; i++) {
		let id = ids[i];
		let text = texts[i];

		const subtext = gnode.selectAll(".nodesubtext.n" + id);
		subtextSelections.push(subtext);
		originalSubtexts.push(subtext.text());
		subtext.text(text);

		const nodetext = gnode.selectAll(".nodetext.n" + id);
		nodetextSelections.push(nodetext);
		originalDys.push(nodetext.attr("dy"));

		nodetext
			.transition()
			.duration(transition_speed)
			.attr("dy", text ? "-0.1em" : "0.3em");
	}

	const interrupt = () => {
		nodetextSelections.forEach((x, i) => {
			x.interrupt().attr("dy", originalDys[i]);
		});
		subtextSelections.forEach((x, i) => {
			x.text(originalSubtexts[i]);
		});
	};
	signal?.addEventListener("abort", interrupt, { once: true });
	await delay(transition_speed);
	signal?.removeEventListener("abort", interrupt);
}
