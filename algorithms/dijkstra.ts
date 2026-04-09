import SHOELACE from "utils/shoelace";
import { AnimationStep, iGraph } from "../types";

export default {
  id: "dijkstra",
  name: "Dijkstra's Algorithm",
  function: dijkstra,
  inputs: {
    startNode: true,
    targetNode: false,
  },
}

function dijkstra(graph: iGraph, start: number): AnimationStep[] {
  let animation: AnimationStep[] = [];
  var dist: Record<number, number> = {};
  var prev: Record<number, number | null> = {};

  var neighbors: Record<number, { id: number, weight: number }[]> = {};

  var q: number[] = [];

  for (var node of graph.nodes) {
    dist[node.id] = Infinity;
    prev[node.id] = null;
    neighbors[node.id] = [];
    q.push(node.id);
  }

  for (var link of graph.links) {
    neighbors[link.source].push({
      id: link.target,
      weight: link.weight,
    });
    neighbors[link.target].push({
      id: link.source,
      weight: link.weight,
    });
  }

  dist[start] = 0;
  animation.push({
    type: "subtext",
    data: { nodes: [start], texts: [String(0)] },
  });
  while (q.length > 0) {
    var u = getNodeWithLowestDist(q, dist);
    animation.push({
      type: "node",
      data: { names: [u], colors: [SHOELACE.color.green[500]] },
    });
    q = q.filter((e) => e !== u);

    for (var n of neighbors[u]) {
      var alt = dist[u] + n.weight;
      animation.push({
        type: "link",
        data: {
          links: [{ source: u, target: n.id }],
          colors: [SHOELACE.color.green[500]],
        },
      });

      if (alt < dist[n.id]) {
        dist[n.id] = alt;
        animation.push({
          type: "subtext",
          data: { nodes: [n.id], texts: [String(alt)] },
        });

        prev[n.id] = u;
      }
    }
  }
  return animation;
};

function getNodeWithLowestDist(q: number[], dist: Record<number, number>) {
  var currentMin = q[0];
  for (var node of q) {
    if (dist[node] < dist[currentMin]) {
      currentMin = node;
    }
  }

  return currentMin;
}
