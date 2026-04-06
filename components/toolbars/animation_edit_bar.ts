import { LitElementWw } from "@webwriter/lit";
import { html, PropertyValues, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { permissionsContext } from "utils/context";
import { PermissionsType, AnimationStep, iGraph } from "types";
import { deleteAnimationStep, setAnimation } from "utils/events";
import WwColorPicker from "components/ui/ww-color-picker";
import SHOELACE from "utils/shoelace";

import styles from "./animation_edit_bar.styles";

import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlButtonGroup from "@shoelace-style/shoelace/dist/components/button-group/button-group.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.js";
import SlDivider from "@shoelace-style/shoelace/dist/components/divider/divider.component.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js";
import { SlChangeEvent, SlInputEvent } from "@shoelace-style/shoelace";

import trash from "@tabler/icons/outline/trash.svg";

@localized()
export class AnimationEditBar extends LitElementWw {
	public static get scopedElements() {
		return {
			"sl-icon": SlIcon,
			"sl-button": SlButton,
			"sl-button-group": SlButtonGroup,
			"sl-input": SlInput,
			"sl-color-picker": SlColorPicker,
			"sl-divider": SlDivider,
			"sl-checkbox": SlCheckbox,
			"ww-color-picker": WwColorPicker,
		};
	}

	static styles = styles;

	@property({ type: Object })
	accessor animation: AnimationStep[] = [];

	@property({ type: Number })
	accessor selectedStep: number | null = null;

	@property({ type: Object })
	accessor selectedNode: number | null = null;

	@property({ type: String })
	accessor nodeColor: string = SHOELACE.color.green[500];

	@property({ type: String })
	accessor linkColor: string = SHOELACE.color.green[500];

	@property({ type: Object })
	accessor graph: iGraph | null = null;

	@consume({ context: permissionsContext, subscribe: true })
	accessor permissions: PermissionsType = null!;

	private _exiting = false;
	private _lastAnimationStep: AnimationStep | null = null;
	private _exitTimer: ReturnType<typeof setTimeout> | null = null;
	private _prevShouldShow = false;

	private _shouldShow(): boolean {
		if (this.selectedStep === null) return false;
		const step = this.animation[this.selectedStep];
		if (!step) return false;
		if (
			this.permissions?.animation?.editStep === false &&
			this.permissions?.animation?.delStep === false &&
			step.type !== "reset"
		)
			return false;
		return true;
	}

	willUpdate(changedProps: PropertyValues<this>) {
		const nowShow = this._shouldShow();

		if (this._prevShouldShow && !nowShow && !this._exiting) {
			if (this.selectedStep !== null) {
				this._lastAnimationStep =
					this.animation[this.selectedStep] ??
					this._lastAnimationStep;
			} else if (changedProps.has("selectedStep")) {
				const oldStep = changedProps.get("selectedStep") as
					| number
					| null;
				if (oldStep != null) {
					this._lastAnimationStep =
						this.animation[oldStep] ?? this._lastAnimationStep;
				}
			}
			this._exiting = true;
			if (this._exitTimer) clearTimeout(this._exitTimer);
			this._exitTimer = setTimeout(() => {
				this._exiting = false;
				this._lastAnimationStep = null;
				this._exitTimer = null;
				this.requestUpdate();
			}, 200);
		} else if (!this._prevShouldShow && nowShow && this._exiting) {
			if (this._exitTimer) clearTimeout(this._exitTimer);
			this._exitTimer = null;
			this._exiting = false;
		}

		this._prevShouldShow = nowShow;

		if (
			changedProps.has("selectedStep") &&
			this.selectedStep !== null &&
			(this.animation[this.selectedStep]?.type === "node" ||
				this.animation[this.selectedStep]?.type === "link")
		) {
			const step = this.animation[this.selectedStep];
			if (step.type === "node") {
				this.nodeColor =
					step.data.colors[step.data.colors.length - 1] ??
					this.nodeColor;
			} else if (step.type === "link") {
				this.linkColor =
					step.data.colors[step.data.colors.length - 1] ??
					this.linkColor;
			}
		}
	}

	updated(_changedProps: PropertyValues<this>) {
		this.classList.toggle(
			"visible",
			!this._exiting && this._prevShouldShow,
		);
		this.classList.toggle("exiting", this._exiting);
	}

	protected render(): TemplateResult | null {
		const animationStep = this._exiting
			? this._lastAnimationStep
			: this._shouldShow()
				? this.animation[this.selectedStep!]
				: null;

		if (!animationStep) {
			return null;
		}

		const output: TemplateResult[] = [];

		if (
			(animationStep.type === "node" || animationStep.type === "link") &&
			this.permissions?.animation?.editStep !== false
		) {
			output.push(html`
				<div>
					<span>${msg("Select color to toggle:")}</span>
					<ww-color-picker
						.value=${animationStep.type === "node"
							? this.nodeColor
							: this.linkColor}
						@input=${(e: any) => {
							this.dispatchEvent(
								new CustomEvent(
									animationStep.type === "node"
										? "node-animation-color-change"
										: "link-animation-color-change",
									{
										bubbles: true,
										composed: true,
										detail: {
											color: e.detail,
										},
									},
								),
							);
						}}
					></ww-color-picker>
				</div>
			`);
		} else if (
			animationStep.type === "subtext" &&
			this.permissions?.animation?.editStep !== false
		) {
			if (!this.graph || this.selectedNode === null) {
				output.push(html`
					<div>
						<span>
							${msg("Select a node to edit its subtext.")}
						</span>
					</div>
				`);
			} else {
				const index = animationStep.data.nodes.indexOf(
					this.selectedNode,
				);
				const text =
					index !== -1 ? animationStep.data.texts[index] : "";

				output.push(html`
					<div>
						<span>${msg("Set node subtext:")}</span>
						<sl-input
							size="small"
							.value=${text}
							@sl-input=${(e: SlInputEvent) => {
								if (!e.target || !("value" in e.target) || typeof e.target.value !== "string") {
									return;
								}
								const newSubtext = e.target.value.trim();
								if (index === -1) {
									this.updateStepData({
										nodes: [
											...animationStep.data.nodes,
											this.selectedNode,
										],
										texts: [
											...animationStep.data.texts,
											newSubtext,
										],
									});
								} else {
									this.updateStepData({
										texts: [
											...animationStep.data.texts.slice(
												0,
												index,
											),
											newSubtext,
											...animationStep.data.texts.slice(
												index + 1,
											),
										],
									});
								}
							}}
						></sl-input>
					</div>
				`);
			}
		} else if (animationStep.type === "reset") {
			output.push(html`
				<div>
					<span>${msg("reset")} &hellip;</span>
					<sl-checkbox
						size="small"
						?disabled=${this.permissions?.animation?.editStep ===
						false}
						?checked=${animationStep.data?.nodes}
						@sl-change=${(e: SlChangeEvent) => {
							if (!e.target || !("checked" in e.target)) {
								return;
							}
							this.updateStepData({ nodes: e.target.checked });
						}}
						>${msg("node colors")}</sl-checkbox
					>
					<sl-checkbox
						size="small"
						?disabled=${this.permissions?.animation?.editStep ===
						false}
						?checked=${animationStep.data?.links}
						@sl-change=${(e: SlChangeEvent) => {
							if (!e.target || !("checked" in e.target)) {
								return;
							}
							this.updateStepData({ links: e.target.checked });
						}}
						>${msg("edge colors")}</sl-checkbox
					>
					<sl-checkbox
						size="small"
						?disabled=${this.permissions?.animation?.editStep ===
						false}
						?checked=${animationStep.data?.subtexts}
						@sl-change=${(e: SlChangeEvent) => {
							if (!e.target || !("checked" in e.target)) {
								return;
							}
							this.updateStepData({ subtexts: e.target.checked });
						}}
						>${msg("node subtexts")}</sl-checkbox
					>
				</div>
			`);
		}

		if (
			(this.permissions?.animation?.editStep !== false ||
				(this.selectedStep !== null &&
					this.animation[this.selectedStep].type === "reset")) &&
			this.permissions?.animation?.delStep !== false
		) {
			output.push(html`<sl-divider vertical></sl-divider>`);
		}

		if (this.permissions?.animation?.delStep !== false) {
			output.push(html`
				<sl-button
					variant="danger"
					size="small"
					@click=${() => this.deleteStep(this.selectedStep)}
				>
					<sl-icon .src=${trash} slot="prefix"></sl-icon>
					${msg("Delete step")}
				</sl-button>
			`);
		}

		return html`${output}`;
	}

	private updateStepData(data: any) {
		if (this.selectedStep === null) {
			return;
		}
		const animationStep = this.animation[this.selectedStep];
		if (!animationStep) {
			return;
		}
		this.animation = [
			...this.animation.slice(0, this.selectedStep),
			{ ...animationStep, data: { ...animationStep.data, ...data } },
			...this.animation.slice(this.selectedStep + 1),
		];
		setAnimation(this.animation, this);
	}

	private deleteStep(index: number | null) {
		if (index === null) {
			return;
		}
		this.selectedStep = null;
		deleteAnimationStep(index, this);
	}
}
