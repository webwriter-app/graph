export type iGraph = {
	nodes: iNode[];
	links: iLink[];
};

type iNode = {
	id: number;
	name: string;
	x?: number;
	y?: number;
};

export type iLink = {
	source: number;
	target: number;
	weight: number;
};

type Point = { x: number; y: number };

/** Where each node of the graph sits, by node id. Not stored in the document. */
export type Positions = Map<number, Point>;

export type AlgorithmType = {
	id: string;
	name: string;
	function: (graph: iGraph, start: number, target: number) => AnimationStep[];
	inputs: {
		startNode: boolean;
		targetNode: boolean;
	};
};

export type AnimationStepType = "subtext" | "reset" | "node" | "link";

type NodeAnimationData = {
	type: "node";
	data: {
		names: number[];
		colors: string[];
	};
};

type LinkAnimationData = {
	type: "link";
	data: {
		links: { source: number; target: number }[];
		colors: string[];
	};
};

type SubtextAnimationData = {
	type: "subtext";
	data: {
		nodes: number[];
		texts: string[];
	};
};

type ResetAnimationData = {
	type: "reset";
	data: {
		nodes?: boolean;
		links?: boolean;
		subtexts?: boolean;
	};
};

export type AnimationStep =
	| NodeAnimationData
	| LinkAnimationData
	| SubtextAnimationData
	| ResetAnimationData;

export type AnimationStatusType = "STOP" | "RUN" | "PAUSE";

export type AlgorithmConfigEventDetail = {
	algorithmId: string;
	startNode: number | null;
	targetNode: number | null;
};

export type AlgorithmConfigEvent = CustomEvent<AlgorithmConfigEventDetail>;

export type PermissionsType = {
	general: {
		play: boolean;
		playbackRate: boolean;
	};
	edit: {
		enabled: boolean;
		addNode: boolean;
		addEdge: boolean;
		editNode: boolean;
		editEdge: boolean;
		delNode: boolean;
		delEdge: boolean;
	};
	algorithm: {
		enabled: boolean;
		executable: string[];
	};
	animation: {
		enabled: boolean;
		editStep: boolean;
		delStep: boolean;
	};
};
