import { css } from "lit";

export default css`
	:host,
	.container {
		display: flex;
	}

	.container {
		display: flex;
		width: 100%;
		height: 100%;
	}

	.divider-container {
		padding-block: var(--sl-spacing-x-small);
	}

	sl-divider {
		margin-left: 0;
	}

	.steps {
		flex-grow: 1;
		padding: var(--sl-spacing-x-small);
		padding-right: var(--sl-spacing-medium);
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-padding-left: var(--sl-spacing-x-small);
		scroll-behavior: smooth;

		display: flex;
		align-items: center;
		gap: var(--sl-spacing-x-small);

		mask: linear-gradient(
			to right,
			#0000,
			#ffff var(--left-fade) calc(100% - var(--right-fade)),
			#0000
		);
		animation: scrollfade;
		animation-timeline: --scrollfade;
		scroll-timeline: --scrollfade x;
	}

	p {
		line-height: 1.3;
		margin: 0 0 0 var(--sl-spacing-small);
		color: var(--sl-color-neutral-600);
		font-size: var(--sl-font-size-small);
	}

	.step {
		scroll-snap-align: start;
	}

	.step::part(base) {
		transition: box-shadow 0.3s;
	}

	.step-playing::part(base) {
		box-shadow: 0 0 0 2px var(--sl-color-success-600);
	}

	.controls {
		padding: var(--sl-spacing-x-small);
		align-self: center;
	}

	@property --left-fade {
		syntax: "<length>";
		inherits: false;
		initial-value: 0;
	}

	@property --right-fade {
		syntax: "<length>";
		inherits: false;
		initial-value: 0;
	}

	@keyframes scrollfade {
		0% {
			--left-fade: 0;
		}
		0.1%,
		100% {
			--left-fade: 0;
		}
		0%,
		97% {
			--right-fade: 4rem;
		}
		100% {
			--right-fade: 0;
		}
	}
`;
