import SHOELACE from "utils/shoelace";
import { AlgorithmType, AnimationStep, iGraph } from "../types";

export default {
  id: "cycle",
  name: "Cycle Detection",
  function: cycle,
  inputs: {
    startNode: false,
    targetNode: false,
  },
} as AlgorithmType;

function cycle(graph: iGraph): AnimationStep[] {
  let animation: AnimationStep[] = [];

  let visited: Record<number, boolean> = {};
  let finished: Record<number, boolean> = {};
  let adjacent: Record<number, number[]> = {};
  for (let n of graph.nodes) {
    adjacent[n.id] = [];
    visited[n.id] = false;
  }
  for (let l of graph.links) {
    adjacent[l.source].push(l.target);
    adjacent[l.target].push(l.source);
  }

  function dfs(current: number, parent: number, start: number, path: number[]) {
    if (finished[current]) return;
    if (visited[current]) {
      if (current === start) {
        animation.push({
          type: "node",
          data: { names: path, colors: path.map((x) => SHOELACE.color.green[500]) },
        });
      }
      return;
    }
    animation.push({
      type: "node",
      data: { names: [current], colors: [SHOELACE.color.yellow[500]] },
    });

    visited[current] = true;
    for (let node = 0; node < adjacent[current].length; node++) {
      if (adjacent[current][node] !== parent)
        dfs(adjacent[current][node], current, start, [
          ...path,
          current,
        ]);
    }
    finished[current] = true;
  }

  for (let node of graph.nodes) {
    finished = {};
    visited = {};
    dfs(node.id, node.id, node.id, []);

    animation.push({ type: "reset", data: {
      nodes: true,
      links: true,
      subtexts: true,
    } });
  }

  return animation;
}
