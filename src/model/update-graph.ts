import { iGraph } from "./types";

export function deleteLink(graph: iGraph, source: number, target: number) {
  return {
    nodes: [...graph.nodes],
    links: graph.links.filter(
      (link) => link.source !== source || link.target !== target
    ),
  };
}

export function deleteNode(graph: iGraph, id: number) {
  return {
    nodes: graph.nodes.filter((node) => node.id !== id),
    links: graph.links.filter(
      (link) => link.source !== id && link.target !== id
    ),
  };
}

export function containsLink(graph: iGraph, source: number, target: number) {
  return graph.links.some(
    (link) =>
      (link.source === source && link.target === target) ||
      (link.source === target && link.target === source)
  );
}

export function addNode(graph: iGraph) {
  return {
    ...graph,
    nodes: [
      ...graph.nodes,
      {
        id: graph.nodes.length > 0 ? graph.nodes[graph.nodes.length - 1].id + 1 : 0,
        name: `Node ${graph.nodes.length + 1}`,
      },
    ],
    links: [...graph.links],
  };
}

export function renameNode(graph: iGraph, id: number, newName: string) {
  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === id ? { ...node, name: newName } : node
    ),
    links: [...graph.links],
  };
}

export function addLink(graph: iGraph, source: number, target: number, weight: number) {
  return {
    nodes: [...graph.nodes],
    links: [
      ...graph.links,
      {
        source,
        target,
        weight,
      },
    ],
  };
}

export function updateLink(
  graph: iGraph,
  source: number,
  target: number,
  newWeight: number
) {
  if (newWeight < 0) return graph;

  return {
    ...graph,
    nodes: [...graph.nodes],
    links: graph.links.map((link) =>
      link.source === source && link.target === target
        ? { ...link, weight: newWeight }
        : link
    ),
  };  
}

/** A graph of plain nodes and links: a link whose ends were turned into node objects by a layout keeps just their ids. */
export function normalizeGraph(value: iGraph | null | undefined): iGraph {
  if (!value) return { nodes: [], links: [] };
  const id = (end: number | { id: number }) => (typeof end === "object" && end ? end.id : end);
  return {
    nodes: value.nodes.map((node) => ({ id: node.id, name: node.name })),
    links: value.links.map((link) => ({ source: id(link.source), target: id(link.target), weight: link.weight })),
  };
}
