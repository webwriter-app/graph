import type { iGraph } from "./types";

/** Texts of the errors that the file formats raise; the widget translates them. */
export type FormatErrors = { emptyFile: string; invalidDot: string; invalidTable: string; invalidWeight: string };

const fail = (message: string): never => {
	throw new Error(message);
};

const toWeight = (text: string | undefined, message: string): number => {
	if (text === undefined || text.trim() === "") return 1;
	const weight = Number(text);
	if (!Number.isFinite(weight) || weight < 0) fail(message);
	return weight;
};

/** Builds a graph from node names and name pairs; equal names are one node and a repeated pair is one link. */
function buildGraph(names: string[], edges: { source: string; target: string; weight: number }[]): iGraph {
	const ids = new Map<string, number>();
	const nodes: iGraph["nodes"] = [];
	const idOf = (name: string) => {
		let id = ids.get(name);
		if (id === undefined) {
			id = nodes.length;
			ids.set(name, id);
			nodes.push({ id, name });
		}
		return id;
	};
	names.forEach(idOf);
	const links: iGraph["links"] = [];
	for (const edge of edges) {
		const source = idOf(edge.source);
		const target = idOf(edge.target);
		if (links.some((link) => (link.source === source && link.target === target) || (link.source === target && link.target === source))) continue;
		links.push({ source, target, weight: edge.weight });
	}
	return { nodes, links };
}

// DOT

const quote = (text: string) => `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;

/** An undirected DOT graph; every node carries its name as label, every link its weight. */
export function toDot(graph: iGraph): string {
	const lines = ["graph G {"];
	for (const node of graph.nodes) lines.push(`  n${node.id} [label=${quote(node.name)}];`);
	for (const link of graph.links) lines.push(`  n${link.source} -- n${link.target} [label=${quote(String(link.weight))}, weight=${link.weight}];`);
	lines.push("}");
	return lines.join("\n") + "\n";
}

const TOKEN = /\s+|\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|("(?:[^"\\]|\\[\s\S])*")|(--|->)|(-?(?:\.\d+|\d+(?:\.\d*)?))|([A-Za-z_\u0080-\uffff][\w\u0080-\uffff]*)|([{}[\];,=:])/y;

function tokenize(text: string, errors: FormatErrors): { kind: "id" | "op" | "punct"; value: string }[] {
	const tokens: { kind: "id" | "op" | "punct"; value: string }[] = [];
	TOKEN.lastIndex = 0;
	while (TOKEN.lastIndex < text.length) {
		const match = TOKEN.exec(text);
		if (!match) return fail(errors.invalidDot);
		if (match[1] !== undefined) tokens.push({ kind: "id", value: match[1].slice(1, -1).replace(/\\(["\\])/g, "$1").replace(/\\n/g, "\n") });
		else if (match[2] !== undefined) tokens.push({ kind: "op", value: match[2] });
		else if (match[3] !== undefined || match[4] !== undefined) tokens.push({ kind: "id", value: match[3] ?? match[4] });
		else if (match[5] !== undefined) tokens.push({ kind: "punct", value: match[5] });
	}
	return tokens;
}

/**
 * Reads the DOT subset that describes a plain graph: node and edge statements with `label` and `weight`
 * attributes. A `digraph` is read as undirected; subgraphs and ports are rejected.
 */
export function fromDot(text: string, errors: FormatErrors): iGraph {
	const tokens = tokenize(text, errors);
	let index = 0;
	const peek = () => tokens[index];
	const is = (kind: string, value?: string) => tokens[index]?.kind === kind && (value === undefined || tokens[index].value === value);
	const keyword = (word: string) => is("id") && peek().value.toLowerCase() === word;

	if (keyword("strict")) index++;
	if (!(keyword("graph") || keyword("digraph"))) fail(errors.invalidDot);
	index++;
	if (is("id")) index++;
	if (!is("punct", "{")) fail(errors.invalidDot);
	index++;

	const labels = new Map<string, string>();
	const order: string[] = [];
	const edges: { source: string; target: string; weight: number }[] = [];
	const nodeId = () => {
		if (!is("id")) return fail(errors.invalidDot);
		const id = tokens[index++].value;
		if (is("punct", ":")) fail(errors.invalidDot);
		if (!order.includes(id)) order.push(id);
		return id;
	};
	const attributes = () => {
		const found: Record<string, string> = {};
		while (is("punct", "[")) {
			index++;
			while (!is("punct", "]")) {
				if (!is("id")) fail(errors.invalidDot);
				const key = tokens[index++].value;
				let value = "true";
				if (is("punct", "=")) {
					index++;
					if (!is("id")) fail(errors.invalidDot);
					value = tokens[index++].value;
				}
				found[key] = value;
				if (is("punct", ",") || is("punct", ";")) index++;
			}
			index++;
		}
		return found;
	};

	while (!is("punct", "}")) {
		if (index >= tokens.length) fail(errors.invalidDot);
		if (is("punct", ";")) {
			index++;
			continue;
		}
		if (keyword("subgraph") || is("punct", "{")) fail(errors.invalidDot);
		if (keyword("graph") || keyword("node") || keyword("edge")) {
			index++;
			attributes();
			continue;
		}
		if (is("id") && tokens[index + 1]?.kind === "punct" && tokens[index + 1].value === "=") {
			index += 2;
			if (!is("id")) fail(errors.invalidDot);
			index++;
			continue;
		}
		const first = nodeId();
		const chain = [first];
		while (is("op")) {
			index++;
			chain.push(nodeId());
		}
		const attrs = attributes();
		if (chain.length === 1) {
			if (attrs.label !== undefined) labels.set(first, attrs.label);
			continue;
		}
		const weight = toWeight(attrs.weight ?? (attrs.label !== undefined && /^\s*-?[\d.]+\s*$/.test(attrs.label) ? attrs.label : undefined), errors.invalidWeight);
		for (let i = 0; i + 1 < chain.length; i++) edges.push({ source: chain[i], target: chain[i + 1], weight });
	}
	// Names may repeat; a node keeps its DOT id as long as the label is unique.
	const name = (id: string) => labels.get(id) ?? id;
	const byName = new Map<string, string>();
	const nameOf = (id: string) => {
		const label = name(id);
		const owner = byName.get(label);
		if (owner === undefined) byName.set(label, id);
		return owner === undefined || owner === id ? label : `${label} (${id})`;
	};
	const names = order.map(nameOf);
	const named = new Map(order.map((id, i) => [id, names[i]]));
	return buildGraph(names, edges.map((edge) => ({ source: named.get(edge.source)!, target: named.get(edge.target)!, weight: edge.weight })));
}

// Tables

/** The cells of a table of text: an edge list or an adjacency matrix. */
export type Rows = string[][];

const EDGE_HEADER = ["source", "target", "weight"];

/** The edge list: one row per link, plus a row with an empty target for a node without links. */
export function toEdgeList(graph: iGraph): Rows {
	const name = new Map(graph.nodes.map((node) => [node.id, node.name]));
	const linked = new Set(graph.links.flatMap((link) => [link.source, link.target]));
	return [
		EDGE_HEADER,
		...graph.links.map((link) => [name.get(link.source) ?? "", name.get(link.target) ?? "", String(link.weight)]),
		...graph.nodes.filter((node) => !linked.has(node.id)).map((node) => [node.name, "", ""]),
	];
}

/** The adjacency matrix: node names on both axes, the weight where two nodes are linked, empty otherwise. */
export function toAdjacencyMatrix(graph: iGraph): Rows {
	const weight = new Map<string, number>();
	for (const link of graph.links) {
		weight.set(`${link.source}:${link.target}`, link.weight);
		weight.set(`${link.target}:${link.source}`, link.weight);
	}
	return [
		["", ...graph.nodes.map((node) => node.name)],
		...graph.nodes.map((row) => [row.name, ...graph.nodes.map((column) => String(weight.get(`${row.id}:${column.id}`) ?? ""))]),
	];
}

/**
 * Reads an edge list (header `source`, `target`, optional `weight`) or an adjacency matrix
 * (names in the first row and first column, a weight where two nodes are linked).
 * The diagonal is ignored (the graph has no self-loops); for an asymmetric matrix the weight above the
 * diagonal wins.
 */
export function fromRows(rows: Rows, errors: FormatErrors): iGraph {
	const filled = rows.filter((row) => row.some((cell) => cell.trim() !== ""));
	if (filled.length === 0) fail(errors.emptyFile);
	const header = filled[0].map((cell) => cell.trim().toLowerCase());
	if (header[0] === "source" && header[1] === "target") {
		const edges: { source: string; target: string; weight: number }[] = [];
		const names: string[] = [];
		for (const row of filled.slice(1)) {
			const [source, target = "", weight] = row.map((cell) => cell.trim());
			if (source === "") fail(errors.invalidTable);
			names.push(source);
			if (target !== "") edges.push({ source, target, weight: toWeight(weight, errors.invalidWeight) });
		}
		return buildGraph(names, edges);
	}
	const names = filled[0].slice(1).map((cell) => cell.trim());
	if (names.length === 0 || filled.length !== names.length + 1 || names.some((name) => name === "")) fail(errors.invalidTable);
	const edges: { source: string; target: string; weight: number }[] = [];
	filled.slice(1).forEach((row, r) => {
		if (row.length !== names.length + 1) fail(errors.invalidTable);
		row.slice(1).forEach((cell, c) => {
			if (cell.trim() !== "" && c > r) edges.push({ source: names[r], target: names[c], weight: toWeight(cell, errors.invalidWeight) });
		});
	});
	// A weight that only appears below the diagonal still counts.
	filled.slice(1).forEach((row, r) => row.slice(1).forEach((cell, c) => {
		if (cell.trim() !== "" && c < r) edges.push({ source: names[r], target: names[c], weight: toWeight(cell, errors.invalidWeight) });
	}));
	return buildGraph(names, edges);
}

// CSV

const field = (cell: string) => (/[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);

export const formatCsv = (rows: Rows): string => rows.map((row) => row.map(field).join(",")).join("\r\n") + "\r\n";

/** Reads comma separated values with quoted fields; a leading byte order mark is ignored. */
export function parseCsv(text: string): Rows {
	const rows: Rows = [];
	let row: string[] = [];
	let cell = "";
	let quoted = false;
	const source = text.replace(/^\uFEFF/, "");
	for (let i = 0; i < source.length; i++) {
		const char = source[i];
		if (quoted) {
			if (char === '"' && source[i + 1] === '"') {
				cell += '"';
				i++;
			} else if (char === '"') quoted = false;
			else cell += char;
		} else if (char === '"') quoted = true;
		else if (char === ",") {
			row.push(cell);
			cell = "";
		} else if (char === "\n" || char === "\r") {
			if (char === "\r" && source[i + 1] === "\n") i++;
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else cell += char;
	}
	if (cell !== "" || row.length) rows.push([...row, cell]);
	return rows;
}

/** The links of the graph as the table that other widgets read from a signal. */
export function edgeTable(graph: iGraph): { columns: string[]; rows: (string | number | null)[][] } {
	const name = new Map(graph.nodes.map((node) => [node.id, node.name]));
	return { columns: EDGE_HEADER, rows: graph.links.map((link) => [name.get(link.source) ?? null, name.get(link.target) ?? null, link.weight]) };
}
