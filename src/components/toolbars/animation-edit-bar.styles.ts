import { css } from "lit";

export default css`
	:host {
		display: none;

		background-color: rgb(255 255 255 / 0.9);
		padding: var(--sl-spacing-2x-small);
		height: 30px;
	}

	:host(.visible) {
		display: flex;
		animation: zoomIn 200ms ease both;
	}

	:host(.exiting) {
		display: flex;
		animation: zoomOut 200ms ease forwards;
	}

	@keyframes zoomIn {
		from { opacity: 0; transform: scale(0.8); }
		to { opacity: 1; transform: scale(1); }
	}

	@keyframes zoomOut {
		from { opacity: 1; transform: scale(1); }
		to { opacity: 0; transform: scale(0.8); }
	}

	* {
		line-height: 1;
	}

	span {
		font-size: var(--sl-font-size-small);
	}

	div {
		display: flex;
		align-items: center;
		gap: var(--sl-spacing-x-small);
		margin-left: var(--sl-spacing-x-small);
		margin-right: var(--sl-spacing-x-small);
	}

	div:has(+ sl-divider) {
		margin-right: 0;
	}

	sl-checkbox {
		margin-left: var(--sl-spacing-x-small);
	}

	sl-checkbox::part(base) {
		display: flex;
	}
`;
