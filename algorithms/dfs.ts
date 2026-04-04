import SHOELACE from "utils/shoelace";
import { AlgorithmType, AnimationStep, iGraph } from "../types";

export default {
  id: "dfs",
  name: "Depth First Search",
  function: dfs,
  inputs: {
    startNode: true,
    targetNode: true,
  },
} as AlgorithmType;

function dfs(graph: iGraph, start: number, target: number): AnimationStep[] {
  let animation: AnimationStep[] = [];

  let visited: Record<number, boolean> = {};
  let adjacent: Record<number, number[]> = {};
  for (let n of graph.nodes) {
    adjacent[n.id] = [];
    visited[n.id] = false;
  }
  for (let l of graph.links) {
    adjacent[l.source].push(l.target);
    adjacent[l.target].push(l.source);
  }

  let stack: number[] = [];
  stack.push(start);

  while (stack.length !== 0) {
    let current = stack.pop();
    if (current === undefined) break;

    animation.push({
      type: "node",
      data: { names: [current], colors: [SHOELACE.color.yellow[500]] },
    });

    if (current === target) {
      animation.push({
        type: "node",
        data: { names: [current], colors: [SHOELACE.color.green[500]] },
      });
      return animation;
    }

    if (visited[current] === false) {
      visited[current] = true;
    }

    for (let node = 0; node < adjacent[current].length; node++) {
      if (!visited[adjacent[current][node]])
        stack.push(adjacent[current][node]);
    }
  }
  return animation;
}
