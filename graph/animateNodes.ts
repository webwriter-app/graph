import { delay } from "../utils/sleep";
import { initSize } from "./buildGraph";
import { Selection, BaseType } from "d3-selection";
import 'd3-transition';

const translate_speed = 2000;

export async function animateNodes(svg: Selection<Element, unknown, null, undefined>, ids: number[], colors: string[], signal?: AbortSignal) {
  let gnode = svg.selectAll("g");

  const selections: Selection<BaseType, unknown, BaseType, unknown>[] = [];
  const originalColors: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    let x = gnode.selectAll(".node.n" + ids[i]);
    selections.push(x);
    originalColors.push(x.attr("fill"));
    x.transition()
      .duration(translate_speed / 5)
      .attr("r", 10)
      .transition()
      .duration(translate_speed / 5)
      .attr("r", initSize)
      .attr("fill", colors[i]);
  }

  const interrupt = () => selections.forEach((x, i) => {
    x.interrupt().attr("r", initSize).attr("fill", originalColors[i]);
  });
  signal?.addEventListener("abort", interrupt, { once: true });
  await delay(translate_speed);
  signal?.removeEventListener("abort", interrupt);
}
