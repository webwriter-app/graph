import { css } from "lit";

export default css`
	:host {
		display: flex;
		padding: var(--sl-spacing-x-small);
	}

	div {
		display: flex;
		gap: var(--sl-spacing-x-small);
		flex: 1;
	}

	sl-select {
		width: 100%;
		line-height: 1;
	}

	sl-select::part(form-control-label) {
		padding-bottom: 0.25em;
	}
`;
