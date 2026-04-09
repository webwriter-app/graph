import { localized, msg } from "@lit/localize";
import { LitElementWw } from "@webwriter/lit";
import { html, css, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import SHOELACE from "../../utils/shoelace";

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
@localized()
export default class WwColorPicker extends LitElementWw {
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

	public static get COLORS() {
		return [
			{
				label: msg("Black"),
				color: SHOELACE.color.gray[950],
			},
			{
				label: msg("Red"),
				color: SHOELACE.color.red[500],
			},
			{
				label: msg("Orange"),
				color: SHOELACE.color.orange[500],
			},
			{
				label: msg("Yellow"),
				color: SHOELACE.color.yellow[500],
			},
			{
				label: msg("Lime"),
				color: SHOELACE.color.lime[500],
			},
			{
				label: msg("Green"),
				color: SHOELACE.color.green[500],
			},
			{
				label: msg("Cyan"),
				color: SHOELACE.color.cyan[500],
			},
			{
				label: msg("Blue"),
				color: SHOELACE.color.blue[500],
			},
			{
				label: msg("Violet"),
				color: SHOELACE.color.violet[500],
			},
			{
				label: msg("Pink"),
				color: SHOELACE.color.pink[500],
			},
		] as const;
	}

	@property({ type: String, attribute: true })
	accessor value = "";

	protected render(): TemplateResult<1> {
		return html`
			<sl-dropdown>
				<sl-button
					slot="trigger"
					outline
					caret
					size="small"
					class="color-picker-button"
					aria-label=${msg("Select Color")}
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
					<sl-details summary=${msg("Custom color")}>
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
		const colors = WwColorPicker.COLORS;

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
