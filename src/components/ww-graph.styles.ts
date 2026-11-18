import { css } from "lit";

export default css`
    :host {
        position: relative;
        display: block;

        width: 100%;
        min-width: 300px;
        max-width: 2100px;
        min-height: 20rem;
        margin-inline: auto;

        color: var(--ww-text-color, var(--sl-color-neutral-900));
        font-family: var(--ww-font-family, inherit);
        background-color: var(--sl-color-neutral-0);

        border: solid 1px var(--sl-color-neutral-300);
        border-radius: var(--sl-border-radius-medium);
        box-sizing: border-box;

        overflow: hidden;
        z-index: 10000000;

        outline: none;
    }
    .root {
        container-type: inline-size;
    }
    .print-note {
        display: none;
    }
    algorithm-bar, edit-bar, animation-bar {
        min-height: 72px;
        align-items: end;
    }
    top-bar, algorithm-bar, edit-bar, animation-bar {
        border-bottom: solid 1px var(--sl-color-neutral-300);
        box-sizing: border-box;
    }
    .graph {
        position: relative;
    }
    animation-edit-bar {
        border: 1px solid var(--sl-color-neutral-300);
        border-radius: calc(var(--sl-border-radius-medium) + var(--sl-spacing-2x-small));
        margin: var(--sl-spacing-x-small);
        position: absolute;
        top: 0;
        inset-inline: 0;
        margin-inline: auto;
        width: fit-content;
        z-index: 10;
    }
    .graph-empty-overlay {
        position: absolute;
        inset: 0;
        padding: var(--sl-spacing-x-large);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }
    .graph-empty-overlay span {
        color: var(--sl-color-neutral-600);
        font-size: var(--sl-font-size-large);
    }
    sl-tab-group {
        --track-width: 0;
    }
    sl-tab-panel {
        --padding: 0;
        position: relative;
    }
    @container (max-width: 480px) {
        animation-edit-bar {
            max-width: calc(100% - 2 * var(--sl-spacing-x-small));
            overflow-x: auto;
        }
    }
    @media print {
        :host {
            min-height: 0;
            border-color: currentColor;
            break-inside: avoid;
        }
        top-bar, sl-tab-group, animation-edit-bar, sl-dialog, .graph-empty-overlay {
            display: none;
        }
        .root.empty .graph {
            display: none;
        }
        .root.empty .print-note {
            display: block;
            padding: 1rem;
        }
        .graph {
            break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    }
`;
