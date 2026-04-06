import { LitElementWw } from '@webwriter/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { property } from 'lit/decorators/property.js';
import { d3Node, iGraph } from '../types';

import { select } from 'd3-selection';
import { buildChart } from '../graph/buildGraph';

export class Graph extends LitElementWw {
    @property({ type: Number }) accessor width: number = 0;
    @property({ type: Number }) accessor height: number = 600;

    private _resizeObserver: ResizeObserver | null = null;

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newWidth = Math.floor(entry.contentRect.width);
                if (newWidth > 0 && newWidth !== this.width) {
                    this.width = newWidth;
                }
            }
        });
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
    }

    @property({ type: Number })
    accessor highlightedNode: number | null = null;
    @property({
        type: Object,
        hasChanged(newVal: { source: number; target: number } | null, oldVal: { source: number; target: number } | null) {
            if (newVal == null && oldVal == null) return false;
            if (newVal == null || oldVal == null) return true;
            return newVal.source !== oldVal.source || newVal.target !== oldVal.target;
        }
    })
    accessor highlightedLink: { source: number; target: number } | null = null;

    @property({ type: Number })
    accessor newEdgeSource: number | null = null;

    @property({ type: String })
    accessor nodeCursorMode: 'default' | 'crosshair' = 'default';

    @property({ type: String })
    accessor linkCursorMode: 'default' | 'crosshair' = 'default';

    private _d3Nodes: d3Node[] = [];

    private _graph: iGraph = {
        nodes: [],
        links: [],
    };
    public get graph() {
        return this._graph;
    }
    @property({ type: Object })
    public set graph(value) {
        if (!value) {
            this._graph = {
                nodes: [],
                links: [],
            };
        } else {
            this._graph = value;
        }
    }

    updated(changedProperties: Map<string, unknown>) {
        if (!this.shadowRoot || this.width === 0) return;
        const svg = select(this.shadowRoot.querySelectorAll('.chart')[0])
            .attr('width', this.width)
            .attr('height', this.height);

        const graphChanged = changedProperties.has('graph');
        const oldGraph = changedProperties.get('graph') as iGraph | undefined;
        const needsRebuild = changedProperties.has('width') ||
            changedProperties.has('height') ||
            changedProperties.has('newEdgeSource') ||
            (graphChanged && this._isStructuralChange(oldGraph));

        if (needsRebuild) {
            svg.selectAll('*').remove();
            const positionedGraph = {
                ...this.graph,
                nodes: this.graph.nodes.map(n => {
                    const prev = this._d3Nodes.find(d => d.id === n.id);
                    return prev?.x !== undefined ? { ...n, x: prev.x, y: prev.y } : n;
                }),
            };
            this._d3Nodes = buildChart(svg, this.width, this.height, positionedGraph, this.newEdgeSource);
            svg.selectAll('.node').attr('fill', 'white');
            if (this.highlightedNode !== null) {
                svg.select(`.node.n${this.highlightedNode}`)
                    .attr('fill', 'var(--sl-color-primary-300)')
                    .attr('stroke-width', 2);
            }
            if (this.highlightedLink !== null) {
                svg.select(`.link.n${this.highlightedLink.source}-n${this.highlightedLink.target}`)
                    .attr('stroke', 'var(--sl-color-primary-300)');
            }
        } else if (graphChanged) {
            // Non-structural change: only update text content, preserve simulation
            for (const node of this.graph.nodes) {
                svg.select(`.nodetext.n${node.id}`).text(node.name);
            }
            for (const link of this.graph.links) {
                svg.select(`.linktext.n${link.source}-n${link.target}`).text(link.weight);
            }
        } else { 
            if (changedProperties.has('highlightedNode')) {
                const oldHighlight = changedProperties.get('highlightedNode') as number | null;
                if (oldHighlight !== null) {
                    svg.select(`.node.n${oldHighlight}`)
                        .attr('fill', 'white')
                        .attr('stroke-width', 1);
                }
                if (this.highlightedNode !== null) {
                    svg.select(`.node.n${this.highlightedNode}`)
                        .attr('fill', 'var(--sl-color-primary-300)')
                        .attr('stroke-width', 2);
                }
            } if (changedProperties.has('highlightedLink')) {
                const oldHighlight = changedProperties.get('highlightedLink') as { source: number; target: number } | null;
                if (oldHighlight !== null) {
                    svg.select(`.link.n${oldHighlight.source}-n${oldHighlight.target}`).attr('stroke', 'lightgray');
                }
                if (this.highlightedLink !== null) {
                    svg.select(`.link.n${this.highlightedLink.source}-n${this.highlightedLink.target}`)
                        .attr('stroke', 'var(--sl-color-primary-300)');
                }
            }
        }

        const event = new CustomEvent('svg-update', {
            bubbles: true,
            composed: true,
            detail: svg,
        });
        this.dispatchEvent(event);
    }

    private _isStructuralChange(oldGraph: iGraph | undefined): boolean {
        if (!oldGraph) return true;
        const g = this.graph;
        if (oldGraph.nodes.length !== g.nodes.length) return true;
        if (oldGraph.links.length !== g.links.length) return true;
        const oldNodeIds = new Set(oldGraph.nodes.map(n => n.id));
        if (g.nodes.some(n => !oldNodeIds.has(n.id))) return true;
        const oldLinkKeys = new Set(oldGraph.links.map(l => `${l.source}-${l.target}`));
        if (g.links.some(l => !oldLinkKeys.has(`${l.source}-${l.target}`))) return true;
        return false;
    }

    static styles = css`
        :host {
            display: block;
            width: 100%;
            line-height: 0;
        }

        svg {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;

            outline: none !important;
        }

        .node,
        .nodetext {
            cursor: var(--node-cursor, default);
        }

        .link,
        .linktext {
            cursor: var(--link-cursor, default);
        }
    `;

    render() {
        return html`
            <svg 
                tabIndex="-1"
                class="chart" 
                style="--node-cursor: ${this.nodeCursorMode}; --link-cursor: ${this.linkCursorMode}"
            ></svg>`;
    }
}
