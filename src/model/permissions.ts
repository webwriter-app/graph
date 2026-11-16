import algorithms from "./algorithms/index";
import type { PermissionsType } from "./types";

export const defaultAccess = (): PermissionsType => ({
	general: { play: true, playbackRate: true },
	edit: { enabled: true, addNode: true, addEdge: true, editNode: true, editEdge: true, delNode: true, delEdge: true },
	algorithm: { enabled: true, executable: algorithms.map((algorithm) => algorithm.id) },
	animation: { enabled: true, editStep: true, delStep: true },
});

/** The permissions with one entry of one group changed. */
export const withPermission = (access: PermissionsType, group: string, id: string, value: unknown): PermissionsType => ({
	...access,
	[group]: { ...access[group as keyof PermissionsType], [id]: value },
});
