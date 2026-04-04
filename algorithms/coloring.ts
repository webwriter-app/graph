import SHOELACE from "utils/shoelace";
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
  if (number === 0) return SHOELACE.color.red[500];
  if (number === 1) return SHOELACE.color.yellow[500];
  if (number === 2) return SHOELACE.color.green[500];
  if (number === 3) return SHOELACE.color.blue[500];
  if (number === 4) return SHOELACE.color.pink[500];
  if (number === 5) return SHOELACE.color.orange[500];
  if (number === 6) return SHOELACE.color.lime[500];
  if (number === 7) return SHOELACE.color.cyan[500];
  if (number === 8) return SHOELACE.color.violet[500];
  return "white";
}
