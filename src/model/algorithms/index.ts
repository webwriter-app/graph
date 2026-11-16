import { AlgorithmType } from "../types";
import bfs from "./bfs";
import dfs from "./dfs";
import dijkstra from "./dijkstra";
import cycle from "./cycle";
import spanTree from "./span-tree";
import coloring from "./coloring";

export default [
	bfs,
	dfs,
	dijkstra,
	spanTree,
	cycle,
	coloring,
] as AlgorithmType[];
