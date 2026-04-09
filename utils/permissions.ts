import { msg } from "@lit/localize";
import algorithms, { getAlgorithmName } from "algorithms";

import edit from "@tabler/icons/outline/edit.svg";
import algorithm from "@tabler/icons/outline/code-asterisk.svg";
import animation from "@tabler/icons/outline/keyframes.svg";
import play from "@tabler/icons/outline/player-play.svg";

export function permissionGroups(): {
	id: "general" | "edit" | "algorithm" | "animation";
	name: string;
	icon: string;

	permissions: {
		id: string;
		name: string;
		type: "checkbox" | "multiselect";
		options?: { id: string; name: string }[];
	}[];
}[] {
	return [
		{
			id: "general",
			name: msg("General"),
			icon: play,

			permissions: [
				{
					id: "play",
					name: msg("Play animation"),
					type: "checkbox",
				},
				{
					id: "playbackRate",
					name: msg("Change playback rate"),
					type: "checkbox",
				},
			],
		},

		{
			id: "edit",
			name: msg("Edit"),
			icon: edit,

			permissions: [
				{
					id: "enabled",
					name: msg('Show "Edit" tab'),
					type: "checkbox",
				},
				{
					id: "addNode",
					name: msg("Add nodes"),
					type: "checkbox",
				},
				{
					id: "addEdge",
					name: msg("Add edges"),
					type: "checkbox",
				},
				{
					id: "editNode",
					name: msg("Edit node labels"),
					type: "checkbox",
				},
				{
					id: "editEdge",
					name: msg("Edit edge weights"),
					type: "checkbox",
				},
				{
					id: "delNode",
					name: msg("Delete nodes"),
					type: "checkbox",
				},
				{
					id: "delEdge",
					name: msg("Delete edges"),
					type: "checkbox",
				},
			],
		},
		{
			id: "algorithm",
			name: msg("Algorithm"),
			icon: algorithm,

			permissions: [
				{
					id: "enabled",
					name: msg('Show "Algorithm" tab'),
					type: "checkbox",
				},
				{
					id: "executable",
					name: msg("Executable algorithms"),
					type: "multiselect",
					options: algorithms.map((a) => ({
						id: a.id,
						name: getAlgorithmName(a.id),
					})),
				},
			],
		},
		{
			id: "animation",
			name: msg("Animation"),
			icon: animation,

			permissions: [
				{
					id: "enabled",
					name: msg('Show "Animation" tab'),
					type: "checkbox",
				},
				{
					id: "editStep",
					name: msg("Edit animation steps"),
					type: "checkbox",
				},
				{
					id: "delStep",
					name: msg("Delete animation steps"),
					type: "checkbox",
				},
			],
		},
	];
}
