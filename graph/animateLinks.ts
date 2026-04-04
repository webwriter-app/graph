import { iLink } from "types";
import { delay } from "../utils/sleep";
import { Selection, BaseType } from "d3-selection";
import 'd3-transition';

export async function animateLinks(svg: Selection<Element, unknown, null, undefined>, links: iLink[], colors: string[], signal?: AbortSignal) {
  const translate_speed = 1000;
  let gnode = svg.selectAll("g");
  const selections: Selection<BaseType, unknown, BaseType, unknown>[] = [];
  const originalStrokes: string[] = [];
  for (let i = 0; i < links.length; i++) {
    let x = gnode.selectAll(
      `.link.n${links[i].source}-n${links[i].target}, .link.n${links[i].target}-n${links[i].source}`
    );
    selections.push(x);
    originalStrokes.push(x.attr("stroke"));
    x.transition()
      .duration(translate_speed / 5)
      .attr("stroke", colors[i])
      .attr("stroke-width", function (d) {
        return 1;
      })
      .transition()
      .duration(translate_speed / 5)
      .attr("stroke-width", function (d) {
        return 8;
      });
  }

  const interrupt = () => selections.forEach((x, i) => {
    x.interrupt().attr("stroke", originalStrokes[i]).attr("stroke-width", 8);
  });
  signal?.addEventListener("abort", interrupt, { once: true });
  await delay(translate_speed);
  signal?.removeEventListener("abort", interrupt);
}
