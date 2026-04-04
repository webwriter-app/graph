import { css } from "lit";

export default css`
	:host {
		display: flex;
		padding: var(--sl-spacing-x-small);
		gap: var(--sl-spacing-x-small);
		align-items: end;
	}

	sl-input {
		width: 100%;
		line-height: 1;
	}

	sl-input::part(form-control-label) {
		padding-bottom: 0.25em;
	}

	p {
		margin: 0;
		margin-left: var(--sl-spacing-small);
		color: var(--sl-color-neutral-600);
		font-size: var(--sl-font-size-small);
		align-self: center;
		line-height: 1;
	}
`;
