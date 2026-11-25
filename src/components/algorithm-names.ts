import type { MsgFn } from "@lit/localize";
import { msg as sourceMsg } from "@lit/localize";

export function getAlgorithmName(id: string, msg: MsgFn = sourceMsg): string {
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
