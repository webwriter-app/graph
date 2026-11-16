import { LitElementWw } from '@webwriter/lit';
import { html, PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { property } from 'lit/decorators/property.js';
import { provide } from '@lit/context';
import type { MsgFn } from "@lit/localize";
import { jsonData } from "@webwriter/lit/data";
import { localizer } from "@webwriter/lit/localize";
import { Permissions } from "@webwriter/lit/permissions";
// @ts-ignore The generated locale codes module is JavaScript without declarations.
import { sourceLocale, targetLocales } from "../../localization/generated/locale-codes.js";
import { permissionsContext } from '../components/context';
import { AlgorithmConfigEvent, AnimationStatusType, AnimationStep, iGraph, PermissionsType } from '../model/types';
import { delay, cancellableDelay } from '../model/sleep';
import { Graph } from '../components/graph-component';
import { TopBar } from '../components/toolbars/top-bar';
import { AlgorithmBar } from '../components/toolbars/algorithm-bar';
import { EditBar } from '../components/toolbars/edit-bar';
import { addNode, addLink, containsLink, normalizeGraph } from '../model/update-graph';
import { emptyVisual, firstNodeId, partsOutsideStep, playStep, previewStep, resetVisual, secondNodeId, sameLink, toggleStepLink, toggleStepNode, withoutLink, withoutNode, type Visual } from '../model/animation';
import { PALETTE } from '../model/palette';
import { AnimationBar } from '../components/toolbars/animation-bar';
import { AnimationEditBar } from '../components/toolbars/animation-edit-bar';
import { OptionsComponent } from '../components/options';
import styles from '../components/ww-graph.styles';

import algorithms from '../model/algorithms/index';
import { defaultAccess, withPermission } from '../model/permissions';
import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlTabGroup from '@shoelace-style/shoelace/dist/components/tab-group/tab-group.component.js';
import SlTab from '@shoelace-style/shoelace/dist/components/tab/tab.component.js';
import SlTabPanel from '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.component.js';
import SlOption from '@shoelace-style/shoelace/dist/components/option/option.component.js';
import SlSelect from '@shoelace-style/shoelace/dist/components/select/select.component.js';
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.component.js';
/**
 * Visualize graphs, run graph algorithms step by step (BFS, DFS, Dijkstra, spanning tree, cycle detection, coloring) and record graph animations.
 * The graph, the recorded animation and the permissions are stored in the widget's data blocks. Permissions limit what readers may edit, run and replay.
 */
@customElement('ww-graph')
export class WwGraph extends LitElementWw {
    static styles = styles;
    /** @internal */
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
            'sl-dialog': SlDialog,
        };
    }

    static actions = {
        configurePermissions: { label: (widget: { msg: MsgFn }) => widget.msg('Configure graph permissions') },
    };

    localize = localizer(this, {
        sourceLocale,
        targetLocales,
        load: (locale) => import(`../../localization/generated/${locale}.ts`),
        drawer: true,
    });
    readonly msg = this.localize.msg;
    // Marks author-only UI with data-ww-can="edit".
    #permissions = new Permissions(this);
    /** The authored JSON data block: graph, animation and permissions. */
    #data = jsonData(this, {
        defaults: {
            graph: { nodes: [], links: [] } as iGraph,
            animation: [] as AnimationStep[],
            permissions: defaultAccess(),
        },
        validate: (value) =>
            Array.isArray(value.graph?.nodes) &&
            Array.isArray(value.graph?.links) &&
            Array.isArray(value.animation) &&
            typeof value.permissions === 'object' &&
            value.permissions !== null,
        changed: (value) => {
            this.graph = value.graph;
            this.animation = value.animation;
            this.access = value.permissions;
        },
    });

    /** Controls which features are available to the user (editing, algorithm execution, animation playback). */
    @provide({ context: permissionsContext })
    @property({ attribute: false })
    accessor access: PermissionsType = defaultAccess();
    @property({ type: String, attribute: true, reflect: true })
    private accessor algorithm: string | null = null;
    @property({ type: Number, attribute: true, reflect: true })
    private accessor startNode: number | null = null;
    @property({ type: Number, attribute: true, reflect: true })
    private accessor targetNode: number | null = null;
    /** Array of animation steps. Each step can color nodes/links, set node subtexts, or reset previous steps. */
    @state()
    accessor animation: AnimationStep[] = [];
    public get graph(): iGraph {
        return this._graph;
    }
    /** The graph data, containing labeled nodes and weighted links. */
    public set graph(value: iGraph) {
        this._graph = normalizeGraph(value);
    }

    @state() private accessor permissionsDialogOpen = false;
    @state() private accessor _graph: iGraph = { nodes: [], links: [] };
    @state() private accessor visual: Visual = emptyVisual();
    @query('display-graph') private accessor graphView!: Graph | null;
    @state() private accessor animationStatus: AnimationStatusType = 'STOP';
    @state() private accessor animationPosition: number = 0;

    @state() private accessor mode: 'edit' | 'animation' | 'algorithm' | null = null;
    @state()
    private accessor selectedAnimationStep: number | null = null;
    @state()
    private accessor selectedNode: number | null = null;
    @state()
    private accessor selectedLink: { source: number; target: number } | null = null;
    @state()
    private accessor addingEdge: boolean = false;
    @state()
    private accessor nodeAnimationColor: string = PALETTE.green;
    @state()
    private accessor linkAnimationColor: string = PALETTE.green;
    @state()
    private accessor playbackRate: number = 1;
    private _animationController: AbortController | null = null;
    private _stepStartTime: number | null = null;
    private _visualBeforeStep: Visual = emptyVisual();
    private readonly _stepDuration = 2000;

    constructor() {
        super();
		this.algorithm = this.getDefaultAlgorithm();

        const on = (type: string, handle: (detail: any) => void) => this.addEventListener(type, ((e: CustomEvent) => handle(e.detail)) as EventListener);
        on('graph-pick', (detail) => this.pick(detail));
        on('graph-connect', ({ source, target }) => this.connect(source, target));
        on('graph-update', (graph) => (this.graph = graph));
        on('animation-update', (animation) => (this.animation = animation));
        on('add-node', () => (this.graph = addNode(this.graph)));
        on('add-edge', () => {
            this.addingEdge = !this.addingEdge;
            this.clearSelection(false);
        });

        this.addEventListener('focusout', (e: FocusEvent) => {
            const newTarget = e.relatedTarget as Node | null;
            if (!newTarget || this.containsDeep(newTarget) || newTarget.contains(this)) return;
            this.clearSelection();
        });
    }

    #abort: AbortController | null = null;
    override connectedCallback() {
        super.connectedCallback();
        this.#abort = new AbortController();
        const { signal } = this.#abort;
        document.addEventListener('pointerdown', this._handleDocumentOutside, { capture: true, signal });
        document.addEventListener('touchstart', this._handleDocumentOutside, { capture: true, passive: true, signal });
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this.#abort?.abort();
        this.#abort = null;
    }

    protected firstUpdated(_changedProperties: PropertyValues): void {
        this.mode = this.access.edit.enabled ? 'edit' : this.access.algorithm.enabled ? 'algorithm' : this.access.animation.enabled ? 'animation' : null;

        this.startNode ??= firstNodeId(this.graph);
        this.targetNode ??= secondNodeId(this.graph);
    }

    protected willUpdate(changed: PropertyValues): void {
        // A step that is being edited shows its own state, without transition.
        if (changed.has('animation') && this.selectedAnimationStep !== null && this.animation[this.selectedAnimationStep]) {
            this.visual = previewStep(this.visual, this.animation[this.selectedAnimationStep]);
        }
    }

    protected updated(changed: PropertyValues): void {
        if (changed.has('_graph') || changed.has('animation') || changed.has('access')) {
            this.#data.set({ graph: this._graph, animation: this.animation, permissions: this.access });
        }
    }

    /** Applies a click on the graph: select, add an edge, or toggle the node or link in the step being edited. */
    private pick(pick: { type: 'NODE'; id: number } | { type: 'LINK'; source: number; target: number } | { type: 'NONE' }) {
        if (pick.type === 'NONE') {
            this.selectedNode = null;
            this.selectedLink = null;
        } else if (pick.type === 'NODE') {
            if (this.addingEdge) return;
            this.selectedLink = null;
            this.selectedNode = pick.id;
            this.editStep((step) => (step.type === 'node' ? toggleStepNode(step, pick.id, this.nodeAnimationColor) : null));
        } else {
            this.selectedNode = null;
            if (this.addingEdge) return;
            this.selectedLink = { source: pick.source, target: pick.target };
            this.editStep((step) => (step.type === 'link' ? toggleStepLink(step, { source: pick.source, target: pick.target }, this.linkAnimationColor) : null));
        }
    }

    /** Adds the link that the reader drew and selects it; the mode ends with it. */
    private connect(source: number, target: number) {
        if (!this.addingEdge) return;
        if (!containsLink(this.graph, source, target)) this.graph = addLink({ ...this.graph }, source, target, 1);
        this.clearSelection();
        this.selectedLink = { source, target };
    }

    private editStep(edit: (step: AnimationStep) => AnimationStep | null) {
        const index = this.selectedAnimationStep;
        if (index === null || this.access?.animation?.editStep === false) return;
        const next = this.animation[index] && edit(this.animation[index]);
        if (next) this.animation = [...this.animation.slice(0, index), next, ...this.animation.slice(index + 1)];
    }

    configurePermissions() {
        this.permissionsDialogOpen = true;
    }

    private async animateGraph() {
        if (this.animationStatus === 'RUN') {
            const signal = this._animationController?.signal;
            if (this.animationPosition < this.animation.length) {
                const currentStep = this.animation[this.animationPosition];

                this.animateStep(currentStep);

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

    /** Applies a single animation step to the graph immediately. */
    animateStep(step: AnimationStep) {
        this._visualBeforeStep = this.visual;
        this.visual = playStep(this.visual, step);
        if (step.type === 'node') this.graphView?.pulse(step.data.names);
    }

    /** Lays the nodes out again from scratch. */
    resetGraph() {
        this.graphView?.relayout();
    }

    private clearSelection(endEdge = true) {
        if (endEdge) this.addingEdge = false;
        this.selectedNode = null;
        this.selectedLink = null;
    }

    private containsDeep(node: Node | null): boolean {
        while (node) {
            if (node === this) return true;
            const root = node.getRootNode();
            node = root instanceof ShadowRoot ? root.host : null;
        }
        return false;
    }

    /** Runs the currently selected algorithm on the graph and starts playing the resulting animation. */
    async executeAlgorithm() {
        if (this.animationStatus !== 'STOP') {
            this.startAnimation();
            return;
        }

        const algorithm = algorithms.find((a) => a.id === this.algorithm);
        if (!algorithm) return;

        const startNode = this.startNode ?? firstNodeId(this.graph);
        const targetNode = this.targetNode ?? secondNodeId(this.graph);
        if (startNode === null || targetNode === null) return;
        this.animation = algorithm.function(this.graph, startNode, targetNode);

        this.startAnimation();
    }

    /** Starts or resumes the animation playback from the current position. */
    public async startAnimation() {
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
        this.visual = resetVisual(this.visual);
        await delay(200);
        this.animationPosition = 0;

        this.animateGraph();
    }

    /** Pauses the animation. If the current step just started, it rewinds to replay it on resume. */
    private pauseAnimation() {
        const elapsed = this._stepStartTime ? Date.now() - this._stepStartTime : 0;
        const effectiveDuration = this._stepDuration / this.playbackRate;
        // Abort current animation step only if it's early in the step
        if (elapsed < effectiveDuration * 0.5) {
            this._animationController?.abort();
            this._animationController = new AbortController();
            this.visual = this._visualBeforeStep;
            this.graphView?.cancelPulses();
            this.animationPosition = Math.max(0, this.animationPosition - 1);
        }
        this.animationStatus = 'PAUSE';
    }

    /** Stops the animation, resets the position to the start, and clears all visual highlights. */
    private stopAlgorithm() {
        this._animationController?.abort();
        this._animationController = null;
        this.animationStatus = 'STOP';
        this.animationPosition = 0;
        this.resetGraph();
        this.visual = resetVisual(this.visual);
    }

    private getDefaultAlgorithm(): string | null {
        return algorithms.find((a) => this.access.algorithm?.executable?.includes(a.id))?.id ?? null;
    }

    private readonly _handleDocumentOutside = (e: Event) => {
        if (!e.composedPath().includes(this)) {
            this.clearSelection();
        }
    };

    private _handleModeChange(e: CustomEvent) {
        this.clearSelection();
        this.selectedAnimationStep = null;

        const newMode = e.detail.mode;

        if (newMode === 'edit') {
            this.stopAlgorithm();
        } else if (newMode === 'algorithm') {
            this.visual = resetVisual(this.visual);
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
            this.visual = resetVisual(this.visual);
            this.selectedAnimationStep = null;
            return;
        }
        const step = this.animation[index];
        this.visual = resetVisual(this.visual, partsOutsideStep(step));
        if (step.type === 'subtext') {
            this.selectedNode = null;
        }
        this.selectedAnimationStep = index;
        if (step.type === 'node' && step.data.colors.length > 0) {
            this.nodeAnimationColor = step.data.colors[step.data.colors.length - 1];
        } else if (step.type === 'link' && step.data.colors.length > 0) {
            this.linkAnimationColor = step.data.colors[step.data.colors.length - 1];
        }
        this.visual = previewStep(this.visual, step);
    }

    private _handleDeleteStep(e: CustomEvent) {
        this._handleSelectStep(new CustomEvent('select-step', { detail: null }));
        const index = e.detail;
        if (index === null || this.animation.length <= index) return;
        this.animation = this.animation.filter((_, i) => i !== index);
    }

    private _handlePlaybackRateChange(e: CustomEvent) {
        this.playbackRate = e.detail.playbackRate;
    }

    private _handlePermissionChange(e: CustomEvent) {
        const { group, id, value } = e.detail;

        this.access = withPermission(this.access, group, id, value);

        // If the currently active mode is disabled, switch to the first available mode
        if (id === 'enabled' && value === false && group === this.mode) {
            const modes: ('edit' | 'algorithm' | 'animation')[] = ['edit', 'algorithm', 'animation'];
            this._handleModeChange(new CustomEvent('mode-change', { detail: { mode: modes.find((m) => this.access[m]?.enabled) ?? null } }));
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
        if (this.selectedNode === nodeId) this.selectedNode = null;

        // If deleted node is current start / target node for algorithm, reset them
        if (this.startNode === nodeId) this.startNode = firstNodeId(this.graph);
        if (this.targetNode === nodeId) this.targetNode = secondNodeId(this.graph);

        this.animation = withoutNode(this.animation, nodeId);
    }

    private _handleDeleteLinkCleanup(e: CustomEvent) {
        const { source, target } = e.detail;

        // If the deleted link is currently selected, deselect it
        if (this.selectedLink && sameLink(this.selectedLink, { source, target })) this.selectedLink = null;

        this.animation = withoutLink(this.animation, { source, target });
    }

    render() {
        return html`
        <div>
            ${this.access.edit.enabled || this.access.algorithm.enabled || this.access.animation.enabled || this.access.general.play ? html`
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
                ${this.access.animation.enabled ? html`
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
                ${this.access.edit.enabled ? html`
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
                ${this.access.algorithm.enabled ? html`
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
                ${this.graph.nodes.length === 0 ? html`
                    <div class="graph-empty-overlay">
                        <span>${this.mode === 'edit'
                            ? this.msg("Add nodes and edges using the toolbar above.")
                            : this.msg("Add nodes and edges using the toolbar in edit mode.")
                        }</span>
                    </div>
                ` : null}
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
                    .visual=${this.visual}
                    .highlightedNode=${
                        this.mode === 'edit' || (this.mode === 'animation' && this.selectedAnimationStep !== null && this.animation[this.selectedAnimationStep]?.type === 'subtext' && this.access.animation.editStep) 
                            ? this.selectedNode
                            : null}
                    .highlightedLink=${this.mode === 'edit' ? this.selectedLink : null}
                    ?addingEdge=${this.addingEdge}

                    .nodeCursorMode=${(this.mode === 'edit' || (this.selectedAnimationStep !== null && ['node', 'subtext'].includes(this.animation[this.selectedAnimationStep].type) && this.access.animation.editStep)) ? 'crosshair' : 'default'}
                    .linkCursorMode=${((this.mode === 'edit' && !this.addingEdge) || (this.selectedAnimationStep !== null && this.animation[this.selectedAnimationStep]?.type === 'link' && this.access.animation.editStep)) ? 'crosshair' : 'default'}
                ></display-graph>
            </div>
        </div>
        
        <sl-dialog data-ww-can="edit" label=${this.msg('Graph permissions')} ?open=${this.permissionsDialogOpen} @sl-after-hide=${() => this.permissionsDialogOpen = false}>
            <options-component
                .access=${this.access}

                @permission-change=${this._handlePermissionChange}
            ></options-component>
        </sl-dialog>`;
    }
}
