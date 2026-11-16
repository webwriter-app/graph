import { PALETTE } from "../palette";
import { AlgorithmType, AnimationStep, iGraph } from "../types";

export default {
  id: "coloring",
  name: "Graph Coloring (Brute Force)",
  function: coloring,
  inputs: {
    startNode: false,
    targetNode: false,
  },
} as AlgorithmType;

function coloring(graph: iGraph): AnimationStep[] {
  let animation: AnimationStep[] = [
    {
      type: "node",
      data: {
        names: graph.nodes.map((n) => n.id),
        colors: graph.nodes.map((_) => mapNumberToColor(0)),
      },
    },
  ];

  let colors: number[] = [];

  for (let i = 0; i < graph.nodes.length; i++) {
    colors[i] = 0;
  }

  let adjacent: Record<number, number[]> = {};
  for (let n of graph.nodes) {
    adjacent[n.id] = [];
  }
  for (let l of graph.links) {
    adjacent[l.source].push(l.target);
    adjacent[l.target].push(l.source);
  }

  if (graph.nodes.length === 1) {
    return animation;
  }

  for (let maxColors = 2; maxColors <= graph.nodes.length; maxColors++) {
    if (coloredRight(colors, graph, adjacent)) break;
    while (
      !coloredRight(colors, graph, adjacent) &&
      colors.some((el) => el < maxColors - 1)
    ) {
      const data = nextColoring(colors, maxColors, graph);
      colors = data.colors;
      animation = [...animation, ...data.animation];
    }
  }
  return animation;
}

function nextColoring(colors: number[], maxColors: number, graph: iGraph) {
  let newColoring = [...colors];
  let animationStep: AnimationStep = {
    type: "node",
    data: { names: [], colors: [] },
  };
  for (let i = 0; i < colors.length; i++) {
    if (colors[i] < maxColors - 1) {
      newColoring[i] = colors[i] + 1;

      animationStep.data.names.push(graph.nodes[i].id);

      animationStep.data.colors.push(mapNumberToColor(colors[i] + 1));

      for (let j = 0; j < i; j++) {
        newColoring[j] = 0;

        animationStep.data.names.push(graph.nodes[j].id);

        animationStep.data.colors.push(mapNumberToColor(0));
      }

      break;
    }
  }
  return { colors: newColoring, animation: [animationStep] };
}

function coloredRight(colors: number[], graph: iGraph, adjacent: Record<number, number[]>) {
  for (let i = 0; i < graph.nodes.length; i++) {
    for (let neigh of adjacent[graph.nodes[i].id]) {
      if (
        colors[i] ===
        colors[graph.nodes.map((node) => node.id).indexOf(neigh)]
      ) {
        return false;
      }
    }
  }
  return true;
}

function mapNumberToColor(number: number) {
  if (number === 0) return PALETTE.red;
  if (number === 1) return PALETTE.yellow;
  if (number === 2) return PALETTE.green;
  if (number === 3) return PALETTE.blue;
  if (number === 4) return PALETTE.pink;
  if (number === 5) return PALETTE.orange;
  if (number === 6) return PALETTE.lime;
  if (number === 7) return PALETTE.cyan;
  if (number === 8) return PALETTE.violet;
  return "white";
}
