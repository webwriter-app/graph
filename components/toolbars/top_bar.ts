import { LitElementWw } from "@webwriter/lit";
import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { permissionsContext } from "utils/context";
import WwKbd from "components/ui/ww-kbd";
import { AnimationStatusType, PermissionsType } from "types";

import styles from "./top_bar.styles";

import SlButtonGroup from "@shoelace-style/shoelace/dist/components/button-group/button-group.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";

import edit from "@tabler/icons/outline/edit.svg";
import algorithm from "@tabler/icons/outline/code-asterisk.svg";
import animation from "@tabler/icons/outline/keyframes.svg";
import play from "@tabler/icons/outline/player-play.svg";
import pause from "@tabler/icons/outline/player-pause.svg";
import stop from "@tabler/icons/outline/player-stop.svg";
import circlePlus from "@tabler/icons/outline/circle-plus-2.svg";
import linkPlus from "@tabler/icons/outline/link-plus.svg";

@localized()
export class TopBar extends LitElementWw {
	public static get scopedElements() {
		return {
			"sl-button-group": SlButtonGroup,
			"sl-button": SlButton,
			"sl-icon": SlIcon,
			"sl-tooltip": SlTooltip,
			"ww-kbd": WwKbd,
		};
	}

	static styles = styles;

	@property({ type: String })
	accessor mode: "edit" | "algorithm" | "animation" | null = null;

	@property({ type: String })
	accessor animationStatus: AnimationStatusType = "STOP";

	@property({ type: Boolean })
	accessor addingEdge: boolean = false;

	@property({ type: Number })
	accessor playbackRate: number = 1;

	@consume({ context: permissionsContext, subscribe: true })
	accessor permissions: PermissionsType = null!;

	protected render(): TemplateResult<1> {
		return html`
			<sl-button-group>
				${this.permissions?.edit?.enabled !== false
					? this.ModeButton(
							"edit",
							edit,
							html`${msg("Edit the graph")}`,
						)
					: null}
				${this.permissions?.algorithm?.enabled !== false
					? this.ModeButton(
							"algorithm",
							algorithm,
							html`${msg("Execute an algorithm on the graph")}`,
						)
					: null}
				${this.permissions?.animation?.enabled !== false
					? this.ModeButton(
							"animation",
							animation,
							html`${msg(
								"Create or customize the algorithm animation",
							)}`,
						)
					: null}
			</sl-button-group>
			<div class="spacer"></div>
			${this.renderCycleButton()}
			<sl-button-group> ${this.renderActionButtons()} </sl-button-group>
		`;
	}

	private renderActionButtons() {
		if (this.mode === "edit") {
			return [
				this.permissions?.edit?.addNode !== false
					? this.ActionButton(
							"Add node",
							"add-node",
							circlePlus,
							html`${msg("Add a node to the graph")}`,
						)
					: null,
				this.permissions?.edit?.addEdge !== false
					? this.ActionButton(
							"Add edge",
							"add-edge",
							linkPlus,
							html`${msg("Add an edge to the graph")}`,
							false,
							this.addingEdge ? "primary" : "default",
						)
					: null,
			];
		}

		const actionButtons = [];
		if (this.permissions?.general?.play !== false) {
			if (this.animationStatus !== "RUN") {
				actionButtons.push(
					this.ActionButton(
						this.mode === "algorithm" ? "Execute" : "Play",
						this.mode === "algorithm"
							? "execute-algorithm"
							: "start-animation",
						play,
						this.mode === "algorithm"
							? html`${msg("Execute the selected algorithm")}`
							: html`${msg("Play the animation")}`,
						false,
						"success",
					),
				);
			} else {
				actionButtons.push(
					this.ActionButton(
						"Pause",
						"pause-animation",
						pause,
						html`${msg("Pause the animation")}`,
						false,
					),
				);
			}
		}
		if (this.animationStatus !== "STOP") {
			actionButtons.push(
				this.ActionButton(
					"Stop",
					"stop-animation",
					stop,
					html`${msg("Stop the animation")}`,
					false,
					"danger",
				),
			);
		}

		return actionButtons;
	}

	private renderCycleButton() {
		if (
			this.mode !== "edit" &&
			this.permissions?.general?.playbackRate !== false &&
			this.permissions?.general?.play !== false
		) {
			return this.PlaybackRateButton();
		}
		return null;
	}

	private ModeButton(mode: string, icon: string, tooltip: TemplateResult) {
		return html`
			<sl-tooltip placement="bottom">
				<span slot="content">${tooltip}</span>
				<sl-button
					size="small"
					variant=${this.mode === mode ? "primary" : "default"}
					@click=${() => {
						this.onModeChange(mode);
					}}
				>
					<sl-icon .src=${icon} slot="prefix"></sl-icon>
					${mode === "edit"
						? msg("Edit")
						: mode === "algorithm"
							? msg("Algorithm")
							: msg("Animation")}
				</sl-button>
			</sl-tooltip>
		`;
	}

	private ActionButton(
		action: string,
		event: string,
		icon: string,
		tooltip: TemplateResult,
		disabled: boolean = false,
		variant:
			| "default"
			| "primary"
			| "danger"
			| "success"
			| "warning" = "default",
		outline: boolean = false,
	) {
		return html`
			<sl-tooltip placement="bottom">
				<span slot="content">${tooltip}</span>
				<sl-button
					size="small"
					variant=${variant}
					?disabled=${disabled}
					?outline=${outline}
					@click=${() => {
						this.dispatchEvent(
							new CustomEvent(event, {
								bubbles: true,
								composed: true,
							}),
						);
					}}
				>
					<sl-icon .src=${icon} slot="prefix"></sl-icon>
					${action}
				</sl-button>
			</sl-tooltip>
		`;
	}

	private PlaybackRateButton() {
		const values = [0.5, 1, 1.5, 2];

		return html`
			<sl-tooltip
				placement="bottom"
				content=${msg("Cycle playback speed")}
			>
				<sl-button
					size="small"
					class="playback-rate-button"
					pill
					@click=${() => {
						const currentIndex = values.indexOf(this.playbackRate);
						const nextIndex = (currentIndex + 1) % values.length;

						this.dispatchEvent(
							new CustomEvent("playback-rate-change", {
								bubbles: true,
								composed: true,
								detail: { playbackRate: values[nextIndex] },
							}),
						);
					}}
				>
					${this.playbackRate}x
				</sl-button>
			</sl-tooltip>
		`;
	}

	private onModeChange(mode: string) {
		this.mode = mode as "edit" | "algorithm" | "animation";
		const event = new CustomEvent("mode-change", {
			bubbles: true,
			composed: true,
			detail: { mode: this.mode },
		});
		this.dispatchEvent(event);
	}
}
