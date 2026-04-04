import { LitElementWw } from "@webwriter/lit";
import { html, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { permissionsContext } from "utils/context";
import { PermissionsType } from "types";

import styles from "./edit_bar.styles";

import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";

import trash from "@tabler/icons/outline/trash.svg";

import { iGraph } from "../../types";
import {
	deleteLink,
	deleteNode,
	renameNode,
	updateLink,
} from "../../utils/updateGraph";

@localized()
export class EditBar extends LitElementWw {
	public static get scopedElements() {
		return {
			"sl-icon": SlIcon,
			"sl-input": SlInput,
			"sl-button": SlButton,
		};
	}

	static styles = styles;

	@property({ type: Object })
	accessor graph: iGraph | null = null;

	@property({ type: Object })
	accessor selectedNode: number | null = null;

	@property({ type: Object })
	accessor selectedLink: { source: number; target: number } | null = null;

	@property({ type: Boolean })
	accessor addingEdge: boolean = false;

	@consume({ context: permissionsContext, subscribe: true })
	accessor permissions: PermissionsType = null!;

	private _handleLabelChange = (e: Event) => {
		const newName = (e.target as any).value?.trim() as string;
		if (newName && this.selectedNode !== null && this.graph) {
			this.dispatchEvent(
				new CustomEvent("graph-update", {
					bubbles: true,
					composed: true,
					detail: renameNode(this.graph, this.selectedNode, newName),
				}),
			);
		}
	};

	private _handleNodeDelete = () => {
		if (this.selectedNode === null || !this.graph) return;
		const nodeId = this.selectedNode;
		this.dispatchEvent(
			new CustomEvent("graph-update", {
				bubbles: true,
				composed: true,
				detail: deleteNode(this.graph, this.selectedNode),
			}),
		);
		this.selectedNode = null;
		this.dispatchEvent(
			new CustomEvent("node-deleted-cleanup", {
				bubbles: true,
				composed: true,
				detail: { nodeId },
			}),
		);
	};

	private _handleWeightChange = (e: Event) => {
		const newWeight = parseFloat((e.target as any).value);

		if (!isNaN(newWeight) && this.selectedLink && this.graph) {
			this.dispatchEvent(
				new CustomEvent("graph-update", {
					bubbles: true,
					composed: true,
					detail: updateLink(
						this.graph,
						this.selectedLink.source,
						this.selectedLink.target,
						newWeight,
					),
				}),
			);
		}
	};

	private _handleLinkDelete = () => {
		if (this.selectedLink === null || !this.graph) return;
		const { source, target } = this.selectedLink;
		this.dispatchEvent(
			new CustomEvent("graph-update", {
				bubbles: true,
				composed: true,
				detail: deleteLink(
					this.graph,
					this.selectedLink.source,
					this.selectedLink.target,
				),
			}),
		);
		this.selectedLink = null;
		this.dispatchEvent(
			new CustomEvent("link-deleted-cleanup", {
				bubbles: true,
				composed: true,
				detail: { source, target },
			}),
		);
	};

	protected render(): TemplateResult<1> {
		if (this.addingEdge) {
			return html`<p>
				${msg("Click on two nodes to add an edge between them.")}
			</p>`;
		}
		if (this.selectedNode !== null && this.graph) {
			const selectedNodeName = this.graph.nodes.find(
				(node) => node.id === this.selectedNode,
			)?.name;
			return html`
				${html`<sl-input
					label="Node label"
					size="small"
					?disabled=${this.permissions?.edit?.editNode === false}
					.value=${selectedNodeName ?? ""}
					@sl-input=${this._handleLabelChange}
				></sl-input>`}
				${this.permissions?.edit?.delNode !== false
					? html`<sl-button
							size="small"
							variant="danger"
							@click=${this._handleNodeDelete}
						>
							<sl-icon .src=${trash} slot="prefix"></sl-icon>
							${msg("Delete")}
						</sl-button>`
					: null}
			`;
		}
		if (this.selectedLink && this.graph) {
			const selectedLink = this.selectedLink;
			const selectedLinkWeight = this.graph.links.find(
				(link) =>
					(link.source === selectedLink.source &&
						link.target === selectedLink.target) ||
					(link.source === selectedLink.target &&
						link.target === selectedLink.source),
			)?.weight;
			return html`
				${html`<sl-input
					label="Edge weight"
					size="small"
					type="number"
					autocomplete="off"
					min="0"
					?disabled=${this.permissions?.edit?.editEdge === false}
					.value=${String(selectedLinkWeight)}
					@sl-input=${this._handleWeightChange}
				></sl-input>`}
				${this.permissions?.edit?.delEdge !== false
					? html`<sl-button
							size="small"
							variant="danger"
							@click=${this._handleLinkDelete}
						>
							<sl-icon .src=${trash} slot="prefix"></sl-icon>
							${msg("Delete")}
						</sl-button>`
					: null}
			`;
		}

		return html`<p>${msg("Select a node or an edge to view details.")}</p>`;
	}
}
