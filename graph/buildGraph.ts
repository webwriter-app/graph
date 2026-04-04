import * as d3 from "d3";
import { Selection } from "d3-selection";
import type { D3DragEvent } from "d3-drag";
import { d3Graph, d3Link, d3Node, iGraph } from "types";

export const initSize = 32;
export const emphSize = 34;

export function buildChart(svg: Selection<Element, unknown, null, undefined>, width: number, height: number, graph: iGraph, newEdgeSource: number | null = null): d3Node[] {
  let radius = initSize;

  const d3Nodes: d3Node[] = graph.nodes.map((n) => ({ ...n }));
  const d3Links: d3Link[] = graph.links
    .map((l) => ({
      source: d3Nodes.find(n => l.source === n.id),
      target: d3Nodes.find(n => l.target === n.id),
      weight: l.weight
    }))
    .filter((l): l is d3Link => l.source !== undefined && l.target !== undefined);

  const simGraph: d3Graph = {
    nodes: d3Nodes,
    links: d3Links,
  };

  // Check if nodes already have positions from a previous layout
  const hasExistingPositions = simGraph.nodes.some((n) => n.x !== undefined && n.y !== undefined);

  var simulation = d3
    .forceSimulation(simGraph.nodes)
    .force("charge", d3.forceManyBody().strength(-500))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collision",
      d3.forceCollide<d3Node>().radius(function (_d) {
        return initSize;
      })
    )
    .force(
      "link",
      d3
        .forceLink<d3Node, d3Link>()
        .id(function (d) {
          return d.id;
        })
        .distance(function () {
          return 150;
        })
        .links(simGraph.links)
    )
    .force("boundary", () => {
      const padding = 64;
      const strength = 1;
      simGraph.nodes.forEach((d) => {
        if (d.x === undefined || d.y === undefined || d.vx === undefined || d.vy === undefined) return;

        if (d.x < padding)           d.vx += strength * (padding - d.x);
        if (d.x > width - padding)   d.vx -= strength * (d.x - (width - padding));
        if (d.y < padding)           d.vy += strength * (padding - d.y);
        if (d.y > height - padding)  d.vy -= strength * (d.y - (height - padding));
      });
    })
    .on("tick", ticked);

  if (hasExistingPositions) {
    // preserve previous positions, only slight adjustments
    simulation.alpha(0.1);
    simGraph.nodes.forEach((n) => { n.vx = 0; n.vy = 0; });
  }

  svg
    .append("line")
    .style("stroke", "lightgreen")
    .style("stroke-width", 0)
    .attr("class", "newlink");

  svg.on("mousemove", function (event) {
    const link = svg.select(".newlink");
    if (newEdgeSource !== null) {
      link.style("stroke-width", 8);
      const source = simGraph.nodes.find(
        (node) => node.id === newEdgeSource
      );
      if (source) {
        link.attr("x1", source.x ?? 0);
        link.attr("y1", source.y ?? 0);
      }
      link.attr("x2", d3.pointer(event)[0]);
      link.attr("y2", d3.pointer(event)[1]);
    } else {
      link.style("stroke-width", 0);
    }
  });

  var glink = svg
    .on("mousedown", async (d, i) => dispatchEvent(d, i, "SVG"))
    .append("g")
    .attr("class", "links")
    .selectAll(".link")
    .data(simGraph.links)
    .enter();

  var link = glink
    .append("line")
    .attr("class", function (d) {
      return `link n${d.source.id}-n${d.target.id}`;
    })
    .attr("stroke", "lightgray")
    .attr("stroke-width", 8)
    .on("mousedown", async (d, i) => dispatchEvent(d, i, "LINK"));

  var linktext = glink
    .append("text")
    .attr("class", function (d) {
      return `linktext n${d.source.id}-n${d.target.id}`;
    })

    .on("mousedown", async (d, i) => dispatchEvent(d, i, "LINK"))

    .attr("text-anchor", "middle")
    .text(function (d) {
      return d.weight;
    });
  var gnode = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(simGraph.nodes)
    .enter();

  var node = gnode
    .append("circle")
    .attr("class", function (d) {
      return "node n" + d.id;
    })
    .attr("r", radius - 0.75)
    .attr("fill", "white")
    .style("stroke", "black")
    .on("mousedown", async (d, i) => dispatchEvent(d, i, "NODE"))
    .call(
      d3
        .drag<SVGCircleElement, d3Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    )
    .on("mouseout", function (_d) {
      d3.select(this).attr("r", initSize);
    })
    .on("mouseover", function (_d) {
      d3.select(this).attr("r", emphSize);
    });

  var nodetext = gnode
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .attr("class", function (d) {
      return "nodetext n" + d.id;
    })
    .text(function (d) {
      return d.name;
    })
    .on("mousedown", async (d, i) => dispatchEvent(d, i, "NODE"))
    .on("mouseover", function (_d, i) {
      gnode.selectAll(".node.n" + i.id).attr("r", emphSize);
    })
    .on("mouseout", function (_d, i) {
      gnode.selectAll(".node.n" + i.id).attr("r", initSize);
    })
    .call(
      d3
        .drag<SVGTextElement, d3Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  var nodesubtext = gnode
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.9em")
    .attr("class", function (d) {
      return "nodesubtext n" + d.id;
    })

    .on("mousedown", async (d, i) => dispatchEvent(d, i, "NODE"))
    .on("mouseover", function (_d, i) {
      gnode.selectAll(".node.n" + i.id).attr("r", emphSize);
    })
    .on("mouseout", function (_d, i) {
      gnode.selectAll(".node.n" + i.id).attr("r", initSize);
    })
    .call(
      d3
        .drag<SVGTextElement, d3Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  function ticked() {
    nodetext
      .attr("x", function (d) {
        return d.x ?? 0;
      })
      .attr("y", function (d) {
        return d.y ?? 0;
      });
    nodesubtext
      .attr("x", function (d) {
        return d.x ?? 0;
      })
      .attr("y", function (d) {
        return d.y ?? 0;
      });
    linktext
      .attr("x", function (d) {
        return ((d.source.x ?? 0) + (d.target.x ?? 0)) / 2;
      })
      .attr("y", function (d) {
        return ((d.source.y ?? 0) + (d.target.y ?? 0)) / 2;
      });
    link
      .attr("x1", function (d) {
        return d.source.x ?? 0;
      })
      .attr("y1", function (d) {
        return d.source.y ?? 0;
      })
      .attr("x2", function (d) {
        return d.target.x ?? 0;
      })
      .attr("y2", function (d) {
        return d.target.y ?? 0;
      });

    node
      .attr("cx", function (d) {
        return (d.x = Math.max(radius, Math.min(width - radius, d.x ?? 0)));
      })
      .attr("cy", function (d) {
        return (d.y = Math.max(radius, Math.min(height - radius, d.y ?? 0)));
      });
  }

  function dragstarted(event: D3DragEvent<SVGElement, d3Node, d3Node>, d: d3Node) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: D3DragEvent<SVGElement, d3Node, d3Node>, d: d3Node) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: D3DragEvent<SVGElement, d3Node, d3Node>, d: d3Node) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3Nodes;
}

function dispatchEvent(d: Event, i: unknown, type: string) {
  d.stopPropagation();
  const event = new CustomEvent("svg-graph-event", {
    bubbles: true,
    composed: true,
    detail: { data: i, type },
  });
  d.target?.dispatchEvent(event);
}
