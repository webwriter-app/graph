import * as d3 from "d3";
import { Selection } from "d3-selection";

export function colorGraphForNodeAnimation(svg: Selection<Element, unknown, null, undefined>, ids: number[], colors: string[]) {
  let gnode = svg.selectAll("g");
  let links = gnode.selectAll(".link");
  links.attr("stroke", "lightgray");
  gnode.selectAll(".node").each(function (d, _) {
    const datum = d as { id: number };
    if (!ids.includes(datum.id)) {
      d3.select(this).transition().attr("fill", "white");
    }
  });
  for (let i = 0; i < ids.length; i++) {
    let x = gnode.selectAll(".node.n" + ids[i]);
    x.transition().attr("fill", colors[i]);
  }
}
