import SHOELACE from "utils/shoelace";
import { AlgorithmType, AnimationStep, iGraph } from "../types";

export default {
  id: "bfs",
  name: "Breadth First Search",
  function: bfs,
  inputs: {
    startNode: true,
    targetNode: true,
  },
} as AlgorithmType;

function bfs(graph: iGraph, start: number, target: number): AnimationStep[] {
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

  let queue: number[] = [];
  queue.splice(0, 0, start);
  visited[start] = true;

  while (queue.length !== 0) {
    let current = queue.pop();
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
      if (
        !visited[adjacent[current][node]] &&
        !queue
          .includes(adjacent[current][node])
      )
        queue.splice(0, 0, adjacent[current][node]);
    }
  }

  return animation;
}
