import { css } from "lit";

export default css`
	:host {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sl-spacing-x-small);
		padding: var(--sl-spacing-x-small);
	}

	div {
		display: flex;
		gap: var(--sl-spacing-x-small);
		flex: 1 1 12rem;
		min-width: 0;
	}

	sl-select {
		width: 100%;
		min-width: 0;
		line-height: 1;
	}

	@container (max-width: 480px) {
		sl-divider {
			display: none;
		}
	}

	sl-select::part(form-control-label) {
		padding-bottom: 0.25em;
	}
`;
