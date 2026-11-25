import { css } from "lit";

export default css`
	h2 {
		margin-top: 0;
		margin-bottom: 0.5em;
		font-size: var(--sl-font-size-large);
		font-weight: var(--sl-font-weight-semibold);
	}

	.permission-group-header {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: var(--sl-font-size-medium);
		font-weight: var(--sl-font-weight-semibold);
		color: var(--sl-color-neutral-900);
	}

	.permission-group-header sl-icon {
		font-size: var(--sl-font-size-large);
	}

	sl-details::part(content) {
		padding-top: 0;
	}

	.permissions {
		display: flex;
		flex-direction: column;
		gap: var(--sl-spacing-x-small);
	}

	sl-switch::part(base) {
		width: 100%;
	}

	sl-switch::part(label) {
		white-space: normal;
		hyphens: auto;
		min-width: 0;
	}
`;
