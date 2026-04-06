import { css } from "lit";

export default css`
	:host {
		display: flex;
		flex-wrap: wrap;
		padding: var(--sl-spacing-x-small);
		gap: var(--sl-spacing-x-small);
	}

	sl-button {
		&::part(label) {
			display: flex;
			align-items: center;
		}
	}

	.playback-rate-button {
		min-width: 48px;
	}

	sl-icon {
		display: inline-block;
		height: 1.5em;
		width: 1.5em;
	}

	.spacer {
		flex-grow: 1;
	}

	.right {
		display: flex;
		gap: var(--sl-spacing-x-small);
		flex-grow: 1;
	}
`;
