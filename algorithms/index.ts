import { msg } from "@lit/localize";
import { AlgorithmType } from "types";
import bfs from "./bfs";
import dfs from "./dfs";
import dijkstra from "./dijkstra";
import cycle from "./cycle";
import spanTree from "./spanTree";
import coloring from "./coloring";

export default [
	bfs,
	dfs,
	dijkstra,
	spanTree,
	cycle,
	coloring,
] as AlgorithmType[];

export function getAlgorithmName(id: string): string {
	const names: Record<string, string> = {
		bfs: msg("Breadth First Search"),
		dfs: msg("Depth First Search"),
		dijkstra: msg("Dijkstra's Algorithm"),
		spanTree: msg("Spanning Tree (Borůvka's Algorithm)"),
		cycle: msg("Cycle Detection"),
		coloring: msg("Graph Coloring (Brute Force)"),
	};
	return names[id] ?? id;
}
