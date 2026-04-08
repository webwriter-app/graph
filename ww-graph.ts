import { LitElementWw } from '@webwriter/lit';
import { css, html, PropertyValueMap, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { property } from 'lit/decorators/property.js';
import { provide } from '@lit/context';
import { localized } from '@lit/localize';
// @ts-ignore
import LOCALIZE from 'localization/generated';
import { permissionsContext } from 'utils/context';
import './components/graph_component.ts';
import { animateLinks } from './graph/animateLinks.ts';
import { animateNodes } from './graph/animateNodes.ts';
import { resetAnimation } from './graph/resetAnimation.ts';
import { setNodeSubTexts } from './graph/setNodeSubText.ts';
import { AlgorithmConfigEvent, AnimationStatusType, AnimationStep, iGraph, PermissionsType } from './types.ts';
import { delay, cancellableDelay } from './utils/sleep.ts';
import { Selection } from 'd3-selection';
import { Graph } from './components/graph_component.ts';
import { TopBar } from './components/toolbars/top_bar.ts';
import { AlgorithmBar } from 'components/toolbars/algorithm_bar.ts';
import { EditBar } from 'components/toolbars/edit_bar.ts';
import { addNode, addLink, containsLink } from 'utils/updateGraph.ts';
import { AnimationBar } from 'components/toolbars/animation_bar.ts';
import { AnimationEditBar } from 'components/toolbars/animation_edit_bar.ts';
import { colorGraphForNodeAnimation } from 'graph/colorGraphForNodeAnimation.ts';
import { colorGraphForLinkAnimation } from 'graph/colorGraphForLinkAnimation.ts';
import { OptionsComponent } from 'components/options.ts';
import SHOELACE from 'utils/shoelace.ts';

import algorithms from './algorithms/index.ts';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlTabGroup from '@shoelace-style/shoelace/dist/components/tab-group/tab-group.component.js';
import SlTab from '@shoelace-style/shoelace/dist/components/tab/tab.component.js';
import SlTabPanel from '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.component.js';
import SlOption from '@shoelace-style/shoelace/dist/components/option/option.component.js';
import SlSelect from '@shoelace-style/shoelace/dist/components/select/select.component.js';
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js';

@localized()
@customElement('ww-graph')
export default class WwGraph extends LitElementWw {
    protected localize = LOCALIZE;

    private _graph: iGraph = {
        nodes: [
            { id: 0, name: 'Ana' },
            { id: 1, name: 'Bob' },
            { id: 2, name: 'Chen' },
            { id: 3, name: 'Ethan' },
            { id: 4, name: 'Frank' },
            { id: 5, name: 'George' },
            { id: 6, name: 'Hanes' },
            { id: 7, name: 'Ina' },
        ],
        links: [
            { source: 7, target: 1, weight: 3 },
            { source: 2, target: 1, weight: 2 },
            { source: 0, target: 2, weight: 1 },
            { source: 0, target: 4, weight: 1 },
            { source: 2, target: 4, weight: 4 },
            { source: 6, target: 4, weight: 4 },
            { source: 6, target: 5, weight: 2 },
            { source: 0, target: 3, weight: 1 },
        ],
    };

    public get graph() {
        return this._graph;
    }
    @property({ type: Object, attribute: true, reflect: true })
    public set graph(value: iGraph) {
        if (!value) {
            this._graph = {
                nodes: [],
                links: [],
            };
            return;
        }

        const g = {
            nodes: value.nodes.map((n) => ({ id: n.id, name: n.name })),
            links: value.links.map((l) => ({
                source: l.source && typeof l.source === 'object' ? (l.source as any).id : l.source,
                target: l.target && typeof l.target === 'object' ? (l.target as any).id : l.target,
                weight: l.weight,
            })),
        };
        this._graph = g;
    }

    @property({ type: Array, attribute: true, reflect: true })
    accessor animation: AnimationStep[] = [];

    @state() private accessor svg: Selection<Element, unknown, null, undefined> | null = null;
    @state() private accessor animationStatus: AnimationStatusType = 'STOP';
    @state() private accessor animationPosition: number = 0;

    @state() private accessor mode: 'edit' | 'animation' | 'algorithm' | null = null;

    private _preventFocusClear = false;
    private _animationController: AbortController | null = null;
    private _stepStartTime: number | null = null;
    private readonly _stepDuration = 2000;

    @property({ type: String, attribute: true, reflect: true })
    private accessor algorithm: string | null = null;
    @property({ type: Number, attribute: true, reflect: true })
    private accessor startNode: number | null = null;
    @property({ type: Number, attribute: true, reflect: true })
    private accessor targetNode: number | null = null;
    @state()
    private accessor selectedAnimationStep: number | null = null;
    @state()
    private accessor selectedNode: number | null = null;
    @state()
    private accessor selectedLink: { source: number; target: number } | null = null;
    @state()
    private accessor addingEdge: boolean = false;
    @state()
    private accessor edgeSource: number | null = null;
    @state()
    private accessor nodeAnimationColor: string = SHOELACE.color.green[500];
    @state()
    private accessor linkAnimationColor: string = SHOELACE.color.green[500];
    @state()
    private accessor playbackRate: number = 1;

    @provide({ context: permissionsContext })
    @property({ type: Object, attribute: true, reflect: true })
    private accessor permissions: PermissionsType = {
        general: {
            play: true,
            playbackRate: true,
        },
        edit: {
            enabled: true,
            addNode: true,
            addEdge: true,
            editNode: true,
            editEdge: true,
            delNode: true,
            delEdge: true,
        },
        algorithm: {
            enabled: true,
            executable: algorithms.map((a) => a.id),
        },
        animation: {
            enabled: true,
            editStep: true,
            delStep: true,
        },
    }

    public static get scopedElements() {
        return {
            'sl-button': SlButton,
            'sl-tooltip': SlTooltip,
            'sl-tab-group': SlTabGroup,
            'sl-tab': SlTab,
            'sl-tab-panel': SlTabPanel,
            'display-graph': Graph,
            'sl-select': SlSelect,
            'sl-option': SlOption,
            'sl-icon': SlIcon,
            'top-bar': TopBar,
            'algorithm-bar': AlgorithmBar,
            'edit-bar': EditBar,
            'animation-bar': AnimationBar,
            'animation-edit-bar': AnimationEditBar,
            'options-component': OptionsComponent,
        };
    }

    async animateGraph() {
        if (this.animationStatus === 'RUN') {
            const signal = this._animationController?.signal;
            if (this.animationPosition < this.animation.length) {
                const currentStep = this.animation[this.animationPosition];

                this.animateStep(currentStep, signal);

                this.animationPosition = this.animationPosition + 1;
                this._stepStartTime = Date.now();
                try {
                    await cancellableDelay(this._stepDuration / this.playbackRate, signal);
                } catch {
                    return;
                }
                this.animateGraph();
            } else {
                this.animationPosition = 0;
                this.animationStatus = 'STOP';
            }
        }
    }

    animateStep(step: AnimationStep, signal?: AbortSignal) {
        if (!this.svg) {
            return;
        }
        if (step.type === 'reset') {
            resetAnimation(this.svg, {
                nodes: step.data?.nodes,
                links: step.data?.links,
                subtexts: step.data?.subtexts,
            });
        } else if (step.type === 'node') {
            animateNodes(this.svg, step.data.names, step.data.colors, signal);
        } else if (step.type === 'link') {
            animateLinks(this.svg, step.data.links as any, step.data.colors, signal);
        } else if (step.type === 'subtext') {
            setNodeSubTexts(this.svg, step.data.nodes, step.data.texts, signal);
        }
    }

    previewStep(step: AnimationStep) {
        if (!this.svg) {
            return;
        }
        if (step.type === 'node') {
            colorGraphForNodeAnimation(this.svg, step.data.names, step.data.colors);
        } else if (step.type === 'link') {
            colorGraphForLinkAnimation(this.svg, step.data.links as any, step.data.colors);
        } else if (step.type === 'subtext') {
            setNodeSubTexts(this.svg, step.data.nodes, step.data.texts);
        }
    }

    constructor() {
        super();
		this.algorithm = this.getDefaultAlgorithm();

        this.addEventListener('svg-graph-event', ((e: CustomEvent) => {
            if (e.detail.type === 'NODE') {
                this.selectedLink = null;
                this.selectedNode = e.detail.data.id;
                if (this.selectedNode === null) {
                    return;
                }
                if (this.addingEdge) {
                    if (this.edgeSource === null) {
                        this.edgeSource = this.selectedNode;
                        return;
                    }
                    else {
                        if (this.selectedNode !== this.edgeSource && !containsLink(this.graph, this.edgeSource, this.selectedNode)) {
                            this.graph = addLink({ ...this.graph }, this.edgeSource, this.selectedNode, 1);
                        }
                        this.selectedLink = {
                            source: this.edgeSource,
                            target: this.selectedNode,
                        };
                        this.selectedNode = null;
                        this.addingEdge = false;
                        this.edgeSource = null;
                        return;
                    }
                }
                if (this.selectedAnimationStep !== null && this.permissions?.animation?.editStep !== false) {
                    const step = this.animation[this.selectedAnimationStep];
                    if (step?.type !== 'node') return;
                    const nodeIndex = step.data.names.findIndex((n) => n === this.selectedNode);
                    if (nodeIndex === -1) {
                        step.data.names.push(this.selectedNode);
                        step.data.colors.push(this.nodeAnimationColor);
                    } else {
                        step.data.names.splice(nodeIndex, 1);
                        step.data.colors.splice(nodeIndex, 1);
                    }
                    this.animation = [
                        ...this.animation.slice(0, this.selectedAnimationStep),
                        step,
                        ...this.animation.slice(this.selectedAnimationStep + 1),
                    ];
                }
            } else if (e.detail.type === 'LINK') {
                const src = e.detail.data.source;
                const tgt = e.detail.data.target;
                this.selectedNode = null;
                if (this.addingEdge) {
                    return;
                }
                this.selectedLink = {
                    source: typeof src === 'object' ? src.id : src,
                    target: typeof tgt === 'object' ? tgt.id : tgt,
                };
                if (this.selectedAnimationStep !== null && this.permissions?.animation?.editStep !== false) {
                    const step = this.animation[this.selectedAnimationStep];
                    if (step?.type !== 'link') return;
                    const linkIndex = step.data.links.findIndex((n) => n.source === this.selectedLink!.source && n.target === this.selectedLink!.target);
                    if (linkIndex === -1) {
                        step.data.links.push(this.selectedLink);
                        step.data.colors.push(this.linkAnimationColor);
                    } else {
                        step.data.links.splice(linkIndex, 1);
                        step.data.colors.splice(linkIndex, 1);
                    }
                    this.animation = [
                        ...this.animation.slice(0, this.selectedAnimationStep),
                        step,
                        ...this.animation.slice(this.selectedAnimationStep + 1),
                    ];
                }
            } else {
                this.selectedNode = null;
                this.selectedLink = null;
            }
        }) as EventListener);

        this.addEventListener('svg-update', ((e: CustomEvent) => {
            this.svg = e.detail;
        }) as EventListener);

        this.addEventListener('animation-status-update', ((e: CustomEvent) => {
            this.animationStatus = e.detail;
        }) as EventListener);

        this.addEventListener('animate-graph', this.animateGraph);

        this.addEventListener('graph-update', ((e: CustomEvent) => {
            this.graph = e.detail;
        }) as EventListener);

        this.addEventListener('animation-position-update', ((e: CustomEvent) => {
            this.animationPosition = e.detail;
        }) as EventListener);

        this.addEventListener('animation-update', ((e: CustomEvent) => {
            this.animation = e.detail;
        }) as EventListener);

        this.addEventListener('algo-update', ((e: CustomEvent) => {
            this.algorithm = e.detail;
        }) as EventListener);

        this.addEventListener('reset-graph', this.resetGraph);

        this.addEventListener('add-node', () => {
            this.graph = addNode(this.graph);
        });

        this.addEventListener('add-edge', () => {
            this.addingEdge = !this.addingEdge;
            this.edgeSource = null;
            this.selectedNode = null;
            this.selectedLink = null;
        });

        this.addEventListener('mousedown', (e: MouseEvent) => {
            this._preventFocusClear = e.composedPath().some(el => el instanceof AnimationEditBar);
        }, true);

        this.addEventListener('focusout', (e: FocusEvent) => {
            if (this._preventFocusClear) {
                this._preventFocusClear = false;
                return;
            }
            const newTarget = e.relatedTarget as Node;
            const stillInside = newTarget && (
                this.contains(newTarget) ||
                this.shadowRoot?.contains(newTarget)
            );
            if (!stillInside) {
                this.addingEdge = false;
                this.edgeSource = null;
                this.selectedNode = null;
                this.selectedLink = null;
            }
        });
    }

    protected firstUpdated(_changedProperties: PropertyValues): void {
        this.mode = this.permissions.edit.enabled ? 'edit' : this.permissions.algorithm.enabled ? 'algorithm' : this.permissions.animation.enabled ? 'animation' : null;

        if (this.startNode === null) {
            this.startNode = this.getDefaultNode();
        }
        if (this.targetNode === null) {
            this.targetNode = this.getDefaultTargetNode();
        }
    }

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (_changedProperties.has('animation') && this.selectedAnimationStep !== null && this.animation[this.selectedAnimationStep]) {
            const step = this.animation[this.selectedAnimationStep];
            if (step.type === 'subtext' && this.svg) {
                const oldAnimation = _changedProperties.get('animation') as AnimationStep[] | undefined;
                const oldStep = oldAnimation?.[this.selectedAnimationStep];
                if (oldStep?.type === 'subtext') {
                    const removedNodes = oldStep.data.nodes.filter(
                        (id: number) => !step.data.nodes.includes(id)
                    );
                    if (removedNodes.length > 0) {
                        setNodeSubTexts(this.svg, removedNodes, removedNodes.map(() => ''));
                    }
                }
            }
            this.previewStep(step);
        }
    }

    resetGraph() {
        const temp = { ...this.graph };
        this.graph = { nodes: [], links: [] };
        this.graph = temp;
    }

    static styles = css`
        :host {
            position: relative;
            display: block;

            width: 100%;

            color: var(--sl-color-neutral-900);
            background-color: var(--sl-color-neutral-0);

            border: solid 1px var(--sl-color-neutral-300);
            border-radius: var(--sl-border-radius-medium);
            box-sizing: border-box;

            overflow: hidden;
            z-index: 10000000;

            outline: none;
        }
        algorithm-bar, edit-bar, animation-bar {
            height: 72px;
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
        sl-tab-group {
            --track-width: 0;
        }
        sl-tab-panel {
            --padding: 0;
            position: relative;
        }
        #subcontainer {
            width: 50%;
        }
        #container {
            display: flex;
            flex-direction: row;
            width: 100%;
        }
    `;

    render() {
        return html`
        <div>
            ${this.permissions.edit.enabled || this.permissions.algorithm.enabled || this.permissions.animation.enabled || this.permissions.general.play ? html`
                <top-bar 
                    .mode=${this.mode} 
                    animationStatus=${this.animationStatus}
                    playbackRate=${this.playbackRate}
                    ?addingEdge=${this.addingEdge}
                    @mode-change=${this._handleModeChange}
                    @execute-algorithm=${this.executeAlgorithm}
                    @start-animation=${this.startAnimation}
                    @pause-animation=${this.pauseAnimation}
                    @stop-animation=${this.stopAlgorithm}
                    @playback-rate-change=${this._handlePlaybackRateChange}
                ></top-bar>
            ` : null}
            <sl-tab-group>
                ${this.permissions.animation.enabled ? html`
                    <sl-tab-panel name="manual" ?active=${this.mode === 'animation'}>
                        <animation-bar
                            .animation=${this.animation}
                            .selectedStep=${this.selectedAnimationStep}
                            .animationPosition=${this.animationPosition}
                            animationStatus=${this.animationStatus}
                            @select-step=${this._handleSelectStep}
                            @stop-animation=${this.stopAlgorithm}
                        ></animation-bar>
                    </sl-tab-panel>
                ` : null}
                ${this.permissions.edit.enabled ? html`
                    <sl-tab-panel name="graph" ?active=${this.mode === 'edit'}>
                        <edit-bar 
                            .graph=${this.graph}
                            .selectedNode=${this.selectedNode}
                            .selectedLink=${this.selectedLink}
                            ?addingEdge=${this.addingEdge}

                            @node-deleted-cleanup=${this._handleDeleteNodeCleanup}
                            @link-deleted-cleanup=${this._handleDeleteLinkCleanup}
                        ></edit-bar>
                    </sl-tab-panel>
                ` : null}
                ${this.permissions.algorithm.enabled ? html`
                    <sl-tab-panel name="algo" ?active=${this.mode === 'algorithm'}>
                        <algorithm-bar 
                            .graph=${this.graph}
                            .selectedAlgorithm=${this.algorithm}
                            .selectedStartNode=${this.startNode}
                            .selectedTargetNode=${this.targetNode}
                            @algorithm-config=${this._handleAlgorithmConfig}
                        ></algorithm-bar>
                    </sl-tab-panel>
                ` : null}
            </sl-tab-group>

            <div class="graph">
                <animation-edit-bar
                    .animation=${this.animation}
                    .selectedStep=${this.mode === 'animation' ? this.selectedAnimationStep : null}
                    .graph=${this.graph}
                    .selectedNode=${this.selectedNode}
                    .nodeColor=${this.nodeAnimationColor}
                    .linkColor=${this.linkAnimationColor}

                    @delete-animation-step=${this._handleDeleteStep}
                    @node-animation-color-change=${(e: CustomEvent) => {
                        this.nodeAnimationColor = e.detail.color;
                    }}
                    @link-animation-color-change=${(e: CustomEvent) => {
                        this.linkAnimationColor = e.detail.color;
                    }}
                ></animation-edit-bar>
                <display-graph 
                    .graph=${this.graph}
                    .highlightedNode=${
                        this.mode === 'edit' || (this.mode === 'animation' && this.selectedAnimationStep !== null && this.animation[this.selectedAnimationStep]?.type === 'subtext' && this.permissions.animation.editStep) 
                            ? this.selectedNode
                            : null}
                    .highlightedLink=${this.mode === 'edit' ? this.selectedLink : null}
                    .newEdgeSource=${this.addingEdge ? this.edgeSource : null}

                    .nodeCursorMode=${(this.mode === 'edit' || (this.selectedAnimationStep !== null && ['node', 'subtext'].includes(this.animation[this.selectedAnimationStep].type) && this.permissions.animation.editStep)) ? 'crosshair' : 'default'}
                    .linkCursorMode=${((this.mode === 'edit' && !this.addingEdge) || (this.selectedAnimationStep !== null && this.animation[this.selectedAnimationStep]?.type === 'link' && this.permissions.animation.editStep)) ? 'crosshair' : 'default'}
                ></display-graph>
            </div>
        </div>
        
        ${this.isContentEditable ? html`
            <options-component
                part="options"
                .permissions=${this.permissions}

                @permission-change=${this._handlePermissionChange}
            ></options-component>
        ` : null}`;
    }

    private _handleModeChange(e: CustomEvent) {
        this.selectedNode = null;
        this.selectedLink = null;
        this.selectedAnimationStep = null;
        this.addingEdge = false;
        this.edgeSource = null;

        const newMode = e.detail.mode;

        if (newMode === 'edit') {
            this.stopAlgorithm();
        } else if (newMode === 'algorithm') {
            if (this.svg) {
                resetAnimation(this.svg);
            }
            this.resetGraph();
        }

        this.mode = newMode;
    }

    /**
     * Saves the selected algorithm and its inputs (startNode, targetNode) to the main component's state
     * @param e The event detail contains the selected algorithm and its inputs (startNode, targetNode)
     */
    private _handleAlgorithmConfig(e: AlgorithmConfigEvent) {
        const { algorithmId, startNode, targetNode } = e.detail;
        this.algorithm = algorithmId;
        this.startNode = startNode;
        this.targetNode = targetNode;
    }

    private _handleSelectStep(e: CustomEvent) {
        const index = e.detail;
        if (index === null || this.animation.length <= index) {
            if (this.svg) {
                resetAnimation(this.svg);
            }
            this.selectedAnimationStep = null;
            return;
        }
        const step = this.animation[index];
        if (this.svg) {
            resetAnimation(this.svg, { nodes: step.type !== 'node', links: step.type !== 'link', subtexts: true });
        }
        if (step.type === 'subtext') {
            this.selectedNode = null;
        }
        this.selectedAnimationStep = index;
        this.previewStep(step);
    }

    private _handleDeleteStep(e: CustomEvent) {
        this._handleSelectStep(new CustomEvent('select-step', { detail: null }));
        const index = e.detail;
        if (index === null || this.animation.length <= index) {
            return;
        }
        this.animation = [
            ...this.animation.slice(0, index),
            ...this.animation.slice(index + 1),
        ];
    }

    private _handlePlaybackRateChange(e: CustomEvent) {
        const { playbackRate } = e.detail;
        this.playbackRate = playbackRate;
    }

    private _handlePermissionChange(e: CustomEvent) {
        const { group, id, value } = e.detail;

        this.permissions = {
            ...this.permissions,
            [group]: {
                ...this.permissions[group as keyof PermissionsType],
                [id]: value,
            },
        };

        // If the currently active mode is disabled, switch to the first available mode
        if (id === 'enabled' && value === false && group === this.mode) {
            const modes: ('edit' | 'algorithm' | 'animation')[] = ['edit', 'algorithm', 'animation'];
            const enabledMode = modes.find((m) => this.permissions[m]?.enabled);
            if (enabledMode) {
                this._handleModeChange(new CustomEvent('mode-change', { detail: { mode: enabledMode } }));
            } else {
                this._handleModeChange(new CustomEvent('mode-change', { detail: { mode: null } }));
            }
        }

        // If all modes were disabled and one gets enabled, switch to that mode
        else if (id === 'enabled' && this.mode === null && value === true) {
            this._handleModeChange(new CustomEvent('mode-change', { detail: { mode: group } }));
        }

        // If the currently selected algorithm gets disabled, switch to the first available algorithm
        else if (group === 'algorithm' && id === 'executable' && !value.includes(this.algorithm)) {
            this.algorithm = this.getDefaultAlgorithm();
        }

        // If animation playback gets disabled while an animation is running, stop the animation
        else if (group === 'general' && id === 'play' && value === false && this.animationStatus === 'RUN') {
            this.stopAlgorithm();
        }

        // Reset playback rate to default if playback rate control gets disabled
        else if (group === 'general' && id === 'playbackRate' && value === false) {
            this.playbackRate = 1;
        }
    }

    private _handleDeleteNodeCleanup(e: CustomEvent) {
        const { nodeId } = e.detail;

        // If the deleted node is currently selected, deselect it
        if (this.selectedNode === nodeId) {
            this.selectedNode = null;
        }

        // If deleted node is current start / target node for algorithm, reset them
        if (this.startNode === nodeId) {
            this.startNode = this.getDefaultNode();
        }
        if (this.targetNode === nodeId) {
            this.targetNode = this.getDefaultTargetNode();
        }

        // Remove deleted node from animation steps
        this.animation = this.animation.map((step) => {
            if (step.type === 'node') {
                const index = step.data.names.findIndex((n) => n === nodeId);
                if (index !== -1) {
                    step.data.names.splice(index, 1);
                    step.data.colors.splice(index, 1);
                }
            } else if (step.type === 'link') {
                const linkIndex = step.data.links.findIndex((l) => l.source === nodeId || l.target === nodeId);
                if (linkIndex !== -1) {
                    step.data.links.splice(linkIndex, 1);
                    step.data.colors.splice(linkIndex, 1);
                }
            } else if (step.type === 'subtext') {
                const subtextIndex = step.data.nodes.findIndex((n) => n === nodeId);
                if (subtextIndex !== -1) {
                    step.data.nodes.splice(subtextIndex, 1);
                    step.data.texts.splice(subtextIndex, 1);
                }
            }
            return step;
        });
    }

    private _handleDeleteLinkCleanup(e: CustomEvent) {
        const { source, target } = e.detail;

        // If the deleted link is currently selected, deselect it
        if (this.selectedLink && ((this.selectedLink.source === source && this.selectedLink.target === target) || (this.selectedLink.source === target && this.selectedLink.target === source))) {
            this.selectedLink = null;
        }

        // Remove deleted link from animation steps
        this.animation = this.animation.map((step) => {
            if (step.type === 'link') {
                const linkIndex = step.data.links.findIndex((l) => (l.source === source && l.target === target) || (l.source === target && l.target === source));
                if (linkIndex !== -1) {
                    step.data.links.splice(linkIndex, 1);
                    step.data.colors.splice(linkIndex, 1);
                }
            }
            return step;
        });
    }

    private async executeAlgorithm() {
        if (this.animationStatus !== 'STOP') {
            this.startAnimation();
            return;
        }

        const algorithm = algorithms.find((a) => a.id === this.algorithm);
        if (!algorithm) return;

        const startNode = this.startNode ?? this.getDefaultNode();
        const targetNode = this.targetNode ?? this.getDefaultTargetNode();
        if (startNode === null || targetNode === null) return;
        this.animation = algorithm.function(this.graph, startNode, targetNode);

        this.startAnimation();
    }

    private async startAnimation() {
        this.selectedAnimationStep = null;

        if (this.animationStatus === 'RUN') return;

        if (this.animationStatus === 'PAUSE') {
            this.animationStatus = 'RUN';
            this.animateGraph();
            return;
        }

        this._animationController?.abort();
        this._animationController = new AbortController();

        this.animationStatus = 'RUN';
        this._stepStartTime = null;
        this.resetGraph();
        if (this.svg) {
            resetAnimation(this.svg);
        }
        await delay(200);
        this.animationPosition = 0;

        this.animateGraph();
    }


    private pauseAnimation() {
        const elapsed = this._stepStartTime ? Date.now() - this._stepStartTime : 0;
        const effectiveDuration = this._stepDuration / this.playbackRate;
        // Abort current animation step only if it's early in the step
        if (elapsed < effectiveDuration * 0.5) {
            this._animationController?.abort();
            this._animationController = new AbortController();
            this.animationPosition = Math.max(0, this.animationPosition - 1);
        }
        this.animationStatus = 'PAUSE';
    }

    private stopAlgorithm() {
        this._animationController?.abort();
        this._animationController = null;
        this.animationStatus = 'STOP';
        this.animationPosition = 0;
        this.resetGraph();
        if (this.svg) {
            resetAnimation(this.svg);
        }
    }

    private getDefaultNode(): number | null {
        if (!this.graph || !this.graph.nodes || this.graph.nodes.length === 0)
            return null;
        return this.graph.nodes[0].id;
    }

    private getDefaultTargetNode(): number | null {
        if (!this.graph || !this.graph.nodes || this.graph.nodes.length === 0)
            return null;
        if (this.graph.nodes.length === 1) return this.graph.nodes[0].id;
        return this.graph.nodes[1].id;
    }

    private getDefaultAlgorithm(): string | null {
        const allowedAlgorithms = algorithms.filter((a) => this.permissions.algorithm?.executable?.includes(a.id));
        if (allowedAlgorithms.length === 0) return null;
        return allowedAlgorithms[0]?.id || null;
    }
}
