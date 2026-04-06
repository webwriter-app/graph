import { LitElementWw } from "@webwriter/lit";
import { html, PropertyValues, TemplateResult } from "lit";
import { consume } from "@lit/context";
import { permissionsContext } from "utils/context";
import { PermissionsType } from "types";
import { localized, msg } from "@lit/localize";

import algorithms, { getAlgorithmName } from "algorithms";

import styles from "./algorithm_bar.styles";

import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";
import SlDivider from "@shoelace-style/shoelace/dist/components/divider/divider.component.js";
import { property, state } from "lit/decorators.js";
import { AlgorithmConfigEventDetail, AlgorithmType, iGraph } from "types";
import { SlChangeEvent } from "@shoelace-style/shoelace";

@localized()
export class AlgorithmBar extends LitElementWw {
	public static get scopedElements() {
		return {
			"sl-icon": SlIcon,
			"sl-tooltip": SlTooltip,
			"sl-select": SlSelect,
			"sl-option": SlOption,
			"sl-divider": SlDivider,
		};
	}

	static styles = styles;

	@property({ type: Object })
	accessor graph: iGraph | null = null;

	@property({ type: String })
	private accessor selectedAlgorithm: string | null = null;
	@property({ type: Number })
	private accessor selectedStartNode: number | null = null;
	@property({ type: Number })
	private accessor selectedTargetNode: number | null = null;

	@consume({ context: permissionsContext, subscribe: true })
	accessor permissions: PermissionsType = null!;

	protected updated(changedProperties: PropertyValues): void {
		if (changedProperties.has('graph') || changedProperties.has('selectedStartNode') || changedProperties.has('selectedTargetNode')) {
			setTimeout(() => {
				const startSelect = this.shadowRoot?.querySelector('#start-select') as any;
				const targetSelect = this.shadowRoot?.querySelector('#target-select') as any;
				if (startSelect) startSelect.value = String(this.selectedStartNode);
				if (targetSelect) targetSelect.value = String(this.selectedTargetNode);
			}, 0);
		}
	}

	protected render(): TemplateResult<1> {
		const executableIds = this.permissions?.algorithm?.executable;
		const visibleAlgorithms = executableIds !== null
			? algorithms.filter((a) => executableIds.includes(a.id))
			: algorithms;

		const algorithm =
			visibleAlgorithms.find(
				(algo) => algo.id === this.selectedAlgorithm,
			) ?? (visibleAlgorithms.length > 0 ? visibleAlgorithms[0] : null);
		const neededInputs = algorithm?.inputs ?? { startNode: false, targetNode: false };

		return html`<div class="left">
				<sl-select
					label=${msg("Select algorithm")}
					size="small"
					hoist
					?disabled=${visibleAlgorithms.length <= 1}
					value=${this.selectedAlgorithm || ""}
					@sl-change=${(e: SlChangeEvent) => {
						if (
							!e.target ||
							!("value" in e.target) ||
							typeof e.target.value !== "string"
						) {
							return;
						}
						this.dispatchAlgorithmConfig({
							algorithmId: e.target.value,
						});
					}}
				>
					${visibleAlgorithms.map(
						(algo) => html`
							<sl-option value=${algo.id}>${getAlgorithmName(algo.id)}</sl-option>
						`,
					)}
				</sl-select>
			</div>

			<sl-divider vertical></sl-divider>

			<div class="right">
				<sl-select
					id="start-select"
					label=${msg("Start node")}
					size="small"
					hoist
					?disabled=${!this.selectedAlgorithm ||
					!neededInputs.startNode}
					.value=${String(this.selectedStartNode)}
					@sl-change=${(e: SlChangeEvent) => {
						if (!e.target || !("value" in e.target)) {
							return;
						}
						this.dispatchAlgorithmConfig({
							startNode: Number(e.target.value),
						});
					}}
				>
					${this.renderNodesAsOptions()}
				</sl-select>

				<sl-select
					id="target-select"
					label=${msg("Target node")}
					size="small"
					hoist
					?disabled=${!this.selectedAlgorithm ||
					!neededInputs.targetNode}
					.value=${String(this.selectedTargetNode)}
					@sl-change=${(e: SlChangeEvent) => {
						if (!e.target || !("value" in e.target)) {
							return;
						}
						this.dispatchAlgorithmConfig({
							targetNode: Number(e.target.value),
						});
					}}
				>
					${this.renderNodesAsOptions()}
				</sl-select>
			</div>`;
	}

	private renderNodesAsOptions() {
		if (!this.graph) return html``;

		const options = this.graph.nodes.map(
			(node) => html`
				<sl-option value=${node.id}>${node.name}</sl-option>
			`,
		);

		return options;
	}

	private dispatchAlgorithmConfig({
		algorithmId = this.selectedAlgorithm,
		startNode = this.selectedStartNode,
		targetNode = this.selectedTargetNode,
	}) {
		if (!algorithmId) {
			return;
		}

		const config: AlgorithmConfigEventDetail = {
			algorithmId: algorithmId,
			startNode: startNode,
			targetNode: targetNode,
		};

		this.dispatchEvent(
			new CustomEvent("algorithm-config", {
				bubbles: true,
				composed: true,
				detail: config,
			}),
		);
	}
}
