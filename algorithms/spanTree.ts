import SHOELACE from "utils/shoelace";
import { AlgorithmType, AnimationStep, iGraph, iLink } from "../types";

export default {
  id: "spanTree",
  name: "Spanning Tree (Borůvka's Algorithm)",
  function: spanTree,
  inputs: {
    startNode: false,
    targetNode: false,
  },
} as AlgorithmType;

function spanTree(graph: iGraph): AnimationStep[] {
  let animation: AnimationStep[] = [];

  let done = false;

  let edgesOfSpan: iLink[] = [];

  let connectedComponents: number[][] = [];

  for (let node of graph.nodes) {
    connectedComponents.push([node.id]);
  }

  while (!done) {
    let cheapestEdges: (iLink | null)[] = connectedComponents.map((x) => null);
    for (let edge of graph.links) {
      if (
        connectedComponents.some(
          (comp) =>
            comp.includes(edge.source) && !comp.includes(edge.target)
        )
      ) {
        if (
          ispreferredover(
            edge,
            cheapestEdges[
              connectedComponents
                .map((node) => node.includes(edge.source))
                .indexOf(true)
            ]
          )
        ) {
          cheapestEdges[
            connectedComponents
              .map((node) => node.includes(edge.source))
              .indexOf(true)
          ] = edge;
        }
        if (
          ispreferredover(
            edge,
            cheapestEdges[
              connectedComponents
                .map((node) => node.includes(edge.target))
                .indexOf(true)
            ]
          )
        ) {
          cheapestEdges[
            connectedComponents
              .map((node) => node.includes(edge.target))
              .indexOf(true)
          ] = edge;
        }
      }
    }
    if (cheapestEdges.every((edge) => edge === null)) {
      done = true;
    } else {
      for (let edge of cheapestEdges) {
        if (
          edge !== null &&
          edgesOfSpan.every(
            (e) =>
              e.source !== edge.source ||
              e.target !== edge.target
          )
        ) {
          edgesOfSpan.push(edge);
          animation.push({
            type: "link",
            data: {
              links: [{ source: edge.source, target: edge.target }],
              colors: [SHOELACE.color.green[500]],
            },
          });
        }
      }

      let newComponents: number[][] = [];
      for (let edge of edgesOfSpan) {
        for (let j = 0; j < newComponents.length; j++) {
          if (
            newComponents[j].includes(edge.source) &&
            !newComponents[j].includes(edge.target)
          ) {
            newComponents[j] = [...newComponents[j], edge.target];
          }
          if (
            newComponents[j].includes(edge.target) &&
            !newComponents[j].includes(edge.source)
          ) {
            newComponents[j] = [...newComponents[j], edge.source];
          }
          if (
            newComponents[j].includes(edge.target) &&
            newComponents[j].includes(edge.source)
          ) {
          }
        }
        if (!newComponents.some((x) => x.includes(edge.source)))
          newComponents.push([edge.source, edge.target]);
      }

      for (let i = 0; i < newComponents.length; i++) {
        for (let j = 0; j < newComponents.length; j++) {
          if (newComponents[j].some((x) => newComponents[i].includes(x))) {
            newComponents[i] = [
              ...new Set([...newComponents[j], ...newComponents[i]]),
            ];
          }
        }
      }

      connectedComponents = [...newComponents];
    }
  }

  return animation;
}

function ispreferredover(edge1: iLink, edge2: iLink | null) {
  return (
    edge2 === null || edge1.weight <= edge2.weight
  );
}
