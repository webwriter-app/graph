import { LitElementWw } from "@webwriter/lit";
import { html, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { permissionsContext } from "utils/context";
import { PermissionsType } from "types";
import { localized, msg } from "@lit/localize";

import styles from "./animation_bar.styles";

import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import SlDivider from "@shoelace-style/shoelace/dist/components/divider/divider.component.js";

import plus from "@tabler/icons/outline/plus.svg";
import circle from "@tabler/icons/outline/circle.svg";
import link from "@tabler/icons/outline/link.svg";
import reset from "@tabler/icons/outline/restore.svg";
import subtext from "@tabler/icons/outline/text-size.svg";

import {
	AnimationStatusType,
	AnimationStep,
	AnimationStepType,
	iGraph,
} from "../../types";
import { setAnimation } from "utils/events";

@localized()
export class AnimationBar extends LitElementWw {
	public static get scopedElements() {
		return {
			"sl-icon": SlIcon,
			"sl-dropdown": SlDropdown,
			"sl-button": SlButton,
			"sl-menu": SlMenu,
			"sl-menu-item": SlMenuItem,
			"sl-divider": SlDivider,
		};
	}

	static styles = styles;

	@property({ type: Object })
	accessor animation: AnimationStep[] = [];

	@property({ type: Object })
	accessor selectedStep: number | null = null;

	@property({ type: Number })
	accessor animationPosition: number = 0;

	@property({ type: String })
	accessor animationStatus: AnimationStatusType = "STOP";

	@consume({ context: permissionsContext, subscribe: true })
	accessor permissions: PermissionsType = null!;

	updated(changedProps: Map<string, unknown>) {
		const scrollToStep = (index: number) => {
			const el = this.renderRoot.querySelector<HTMLElement>(
				`#step-${index}`,
			);
			const container =
				this.renderRoot.querySelector<HTMLElement>(".steps");
			if (!el || !container) return;
			const containerRect = container.getBoundingClientRect();
			const elRect = el.getBoundingClientRect();
			const isVisible =
				elRect.left >= containerRect.left &&
				elRect.right + 16 <= containerRect.right;
			if (!isVisible)
				container.scrollLeft += elRect.left - containerRect.left;
		};

		if (changedProps.has("selectedStep") && this.selectedStep !== null) {
			scrollToStep(this.selectedStep);
		}
		if (
			changedProps.has("animationPosition") &&
			this.animationStatus === "RUN"
		) {
			scrollToStep(this.animationPosition - 1);
		}
	}

	protected render(): TemplateResult<1> {
		return html`<div class="container">
			${this.animation.length > 0
				? html`<div class="steps" @click=${this._handleStepsClick}>
						${this.animation.map((step, index) =>
							this.renderStep(step, index),
						)}
					</div>`
				: html`<div class="no-steps" @click=${this._handleStepsClick}>
						<p>
							${msg(
								'No animation steps yet. Execute an algorithm or click "Add step" to create one.',
							)}
						</p>
					</div>`}


			${this.permissions?.animation?.editStep !== false
				? html` <div class="divider-container">
							<sl-divider vertical></sl-divider>
						</div>

						<div class="controls">
							<sl-dropdown
								hoist
								placement="bottom-end"
								?disabled=${this.animationStatus === "RUN"}
							>
								<sl-button
									slot="trigger"
									caret
									size="small"
									?disabled=${this.animationStatus === "RUN"}
								>
									<sl-icon
										.src=${plus}
										slot="prefix"
									></sl-icon>
									${msg("Add step")}
								</sl-button>
								<sl-menu
									@sl-select=${(e: CustomEvent) =>
										this.addStep(e.detail.item.value)}
								>
									<sl-menu-item value="node">
										<sl-icon
											.src=${circle}
											slot="prefix"
										></sl-icon>
										${msg("Add node animation")}
									</sl-menu-item>
									<sl-menu-item value="link">
										<sl-icon
											.src=${link}
											slot="prefix"
										></sl-icon>
										${msg("Add edge animation")}
									</sl-menu-item>
									<sl-menu-item value="reset">
										<sl-icon
											.src=${reset}
											slot="prefix"
										></sl-icon>
										${msg("Add reset animation")}
									</sl-menu-item>
									<sl-menu-item value="subtext">
										<sl-icon
											.src=${subtext}
											slot="prefix"
										></sl-icon>
										${msg("Add node subtext")}
									</sl-menu-item>
								</sl-menu>
							</sl-dropdown>
						</div>`
				: null}
		</div>`;
	}

	private renderStep(step: AnimationStep, index: number): TemplateResult {
		const isPlaying =
			this.animationStatus === "RUN" &&
			index === this.animationPosition - 1;
		const isSelected = this.selectedStep === index && !isPlaying;
		return html`<sl-button
			class="step${isPlaying ? " step-playing" : ""}"
			id="step-${index}"
			size="small"
			pill
			?outline=${isPlaying}
			@click=${() => this._handleSelectStep(index)}
			variant=${isPlaying
				? "success"
				: isSelected
					? "primary"
					: "default"}
		>
			<sl-icon
				.src=${this.getIconForType(step.type)}
				slot="prefix"
			></sl-icon>
			${index + 1}
		</sl-button>`;
	}

	private addStep(type: AnimationStepType) {
		const newNodeStep: AnimationStep = {
			type: "node",
			data: { names: [], colors: [] },
		};
		const newLinkStep: AnimationStep = {
			type: "link",
			data: { links: [], colors: [] },
		};
		const newSubtextStep: AnimationStep = {
			type: "subtext",
			data: { nodes: [], texts: [] },
		};
		const newResetStep: AnimationStep = {
			type: "reset",
			data: { nodes: true, links: true, subtexts: true },
		};

		const newStep: AnimationStep =
			type === "node"
				? newNodeStep
				: type === "link"
					? newLinkStep
					: type === "subtext"
						? newSubtextStep
						: newResetStep;
		this.animation = [...this.animation, newStep];
		setAnimation(this.animation, this);
		this._handleSelectStep(this.animation.length - 1);
	}

	private getIconForType(type: AnimationStepType): any {
		if (type === "node") return circle;
		if (type === "link") return link;
		if (type === "reset") return reset;
		if (type === "subtext") return subtext;
		return null;
	}

	private _handleSelectStep(step: number | null) {
		if (this.animationStatus !== "STOP") {
			this.dispatchEvent(
				new CustomEvent("stop-animation", {
					bubbles: true,
					composed: true,
				}),
			);
		}
		this.dispatchEvent(
			new CustomEvent("select-step", {
				bubbles: true,
				composed: true,
				detail: step,
			}),
		);
	}

	private _handleStepsClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			this._handleSelectStep(null);
		}
	}
}
