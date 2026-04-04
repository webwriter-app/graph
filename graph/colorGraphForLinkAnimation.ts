import * as d3 from "d3";
import { iLink } from "types";
import { Selection } from "d3-selection";

export function colorGraphForLinkAnimation(svg: Selection<Element, unknown, null, undefined>, links: iLink[], colors: string[]) {
  let gnode = svg.selectAll("g");
  let nodes = gnode.selectAll(".node");
  nodes.attr("fill", "white");
  gnode.selectAll(".link").each(function (d, _) {
    const datum = d as { source: { id: number }, target: { id: number } };
    if (
      links.every(
        (link) => 
          (link.source !== datum.source.id || link.target !== datum.target.id) &&
          (link.source !== datum.target.id || link.target !== datum.source.id)
      )
    ) {
      d3.select(this).attr("stroke", "lightgray");
    }
  });
  for (let i = 0; i < links.length; i++) {
    let x = gnode.selectAll(
      `.link.n${links[i].source}-n${links[i].target}, .link.n${links[i].target}-n${links[i].source}`
    );
    x.transition().attr("stroke", colors[i]);
  }
}
