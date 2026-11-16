import { widgetMsg } from "@webwriter/lit/localize";
import { LitElementWw } from "@webwriter/lit";
import { html, css, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { PALETTE } from "../../model/palette";

import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js";
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlDivider from "@shoelace-style/shoelace/dist/components/divider/divider.component.js";
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.js";
import SlDetails from "@shoelace-style/shoelace/dist/components/details/details.component.js";
import { SlInputEvent } from "@shoelace-style/shoelace";

/**
 * A simple color picker component that displays a grid of color options.
 * Emits an `input` event with the selected color when a color is clicked.
 */

export default class WwColorPicker extends LitElementWw {
  protected readonly msg = widgetMsg(this);
	public static get scopedElements() {
		return {
			"sl-dropdown": SlDropdown,
			"sl-menu": SlMenu,
			"sl-button": SlButton,
			"sl-divider": SlDivider,
			"sl-color-picker": SlColorPicker,
			"sl-details": SlDetails,
		};
	}

	public get COLORS() {
		return [
			{
				label: this.msg("Black"),
				color: PALETTE.gray950,
			},
			{
				label: this.msg("Red"),
				color: PALETTE.red,
			},
			{
				label: this.msg("Orange"),
				color: PALETTE.orange,
			},
			{
				label: this.msg("Yellow"),
				color: PALETTE.yellow,
			},
			{
				label: this.msg("Lime"),
				color: PALETTE.lime,
			},
			{
				label: this.msg("Green"),
				color: PALETTE.green,
			},
			{
				label: this.msg("Cyan"),
				color: PALETTE.cyan,
			},
			{
				label: this.msg("Blue"),
				color: PALETTE.blue,
			},
			{
				label: this.msg("Violet"),
				color: PALETTE.violet,
			},
			{
				label: this.msg("Pink"),
				color: PALETTE.pink,
			},
		] as const;
	}

	@property({ type: String, attribute: true })
	accessor value = "";

	protected render(): TemplateResult<1> {
		return html`
			<sl-dropdown hoist>
				<sl-button
					slot="trigger"
					outline
					caret
					size="small"
					class="color-picker-button"
					aria-label=${this.msg("Select Color")}
				>
					<div
						class="color-swatch"
						style="background-color: ${this.value};"
					></div>
				</sl-button>
				<sl-menu
					><div class="color-swatches">
						${this.renderColorSwatches()}
					</div>
					<sl-divider></sl-divider>
					<sl-details summary=${this.msg("Custom color")}>
						<sl-color-picker
							.value=${this.value}
							@sl-input=${(e: SlInputEvent) => {
								if (!e.target || !("value" in e.target)) {
									return;
								}
								this.dispatchEvent(
									new CustomEvent("input", {
										bubbles: true,
										composed: true,
										detail: e.target.value,
									}),
								);
							}}
							inline
							no-format-toggle
						></sl-color-picker>
					</sl-details>
				</sl-menu>
			</sl-dropdown>
		`;
	}

	renderColorSwatches() {
		const colors = this.COLORS;

		return html`${colors.map(({ label, color }) => {
			return html`<button
				class=${classMap({ current: this.value === color })}
				title="${label}"
				@click=${() => {
					this.dispatchEvent(
						new CustomEvent("input", {
							detail: color,
							bubbles: true,
							composed: true,
						}),
					);
				}}
			>
				<div
					class="color-swatch"
					style="background-color: ${color};"
				></div>
			</button>`;
		})}`;
	}

	static styles = css`
		sl-menu {
			overflow-y: auto;
		}

		.color-swatches {
			display: grid;
			grid-template-columns: repeat(5, 1fr);
		}

		button {
			border: none;
			background: none;
			cursor: pointer;
			padding: var(--sl-spacing-x-small);
			margin: 0;
			border-radius: var(--sl-border-radius-medium);
		}

		.color-swatch {
			position: relative;
			width: 1.5em;
			height: 1.5em;
			border-radius: var(--sl-border-radius-circle);
		}

		.current .color-swatch {
			outline: 4px solid var(--sl-color-primary-200);
		}

		.color-picker-button::part(label) {
			display: flex;
			align-items: center;
		}

		sl-color-picker {
			--grid-width: 180px;
			max-width: 180px;
		}

		sl-color-picker::part(base) {
			border: none;
		}

		sl-details::part(base) {
			border: none;
		}

		sl-details::part(header) {
			padding: var(--sl-spacing-x-small) var(--sl-spacing-small);
			font-size: var(--sl-font-size-small);
			color: var(--sl-color-neutral-700);
		}

		sl-details::part(content) {
			padding-right: 0;
			padding-left: 0;
			padding-bottom: 0;
		}
	`;
}

declare global {
	interface HTMLElementTagNameMap {
		"ww-color-picker": WwColorPicker;
	}
}
