# Graph (`@webwriter/graph@2.1.1`)
[License: MIT](LICENSE) | Version: 2.1.1

Visualize graphs, simulate common graph algorithms (Kruskal, Dijkstra, BFS, DFS, etc.), and record your own graph animations.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| People | `@webwriter/graph/snippets/people.html` |
| Dijkstra | `@webwriter/graph/snippets/dijkstra.html` |
| Kruskal | `@webwriter/graph/snippets/kruskal.html` |



## `WwGraph` (`<ww-graph>`)
Visualize graphs, run graph algorithms step by step (BFS, DFS, Dijkstra, spanning tree, cycle detection, coloring) and record graph animations.
The graph, the recorded animation and the permissions are stored in the widget's data blocks. Permissions limit what readers may edit, run and replay.

Conversions: a `table` (edge list or square adjacency matrix) becomes a graph, and the graph becomes an adjacency matrix `table`.
Files: DOT (`.gv`, `.dot`) and an edge list as CSV (`.csv`), both ways. The graph is undirected, so a `digraph` is read without directions.
Formats carry names, links and weights, not the layout or the animation; an import replaces the graph and clears the animation.
Signals: `nodeCount` (number) and `edges` (table with columns source, target, weight).

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/graph/widgets/ww-graph.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/graph/widgets/ww-graph.js"></script>
<ww-graph></ww-graph>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/graph
```

```html
<link href="@webwriter/graph/widgets/ww-graph.css" rel="stylesheet">
<script type="module" src="@webwriter/graph/widgets/ww-graph.js"></script>
<ww-graph></ww-graph>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `WwGraph.actions` | `object` | - | `{ configurePermissions: { label: (widget: { msg: MsgFn }) => widget.msg('Configure graph permissions') }, }` | ✗ |
| `WwGraph.convertFrom` | - | - | `convertFrom` | ✗ |
| `WwGraph.convertTo` | - | - | `convertTo` | ✗ |
| `localize` | - | - | - | ✗ |
| `msg` | - | - | - | ✗ |
| `signals` | `object` | - | `{ nodeCount: computed(() => this.#graphValue.get().nodes.length), edges: computed(() => edgeTable(this.#graphValue.get())) }` | ✗ |
| `access` | `PermissionsType` | Controls which features are available to the user (editing, algorithm execution, animation playback). | - | ✗ |
| `animation` | `AnimationStep[]` | Array of animation steps. Each step can color nodes/links, set node subtexts, or reset previous steps. | `[]` | ✗ |
| `graph` | `iGraph` | The graph data, containing labeled nodes and weighted links. | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `configurePermissions` | - | -
| `animateStep` | Applies a single animation step to the graph immediately. | `step: AnimationStep`
| `resetGraph` | Lays the nodes out again from scratch. | -
| `executeAlgorithm` | Runs the currently selected algorithm on the graph and starts playing the resulting animation. | -
| `startAnimation` | Starts or resumes the animation playback from the current position. | -

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## CSS parts
| Name | Description |
| :--: | :---------: |
| graph | The area that holds the graph. |
| node | A node of the graph. |

*[CSS parts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_shadow_parts) allow freely styling internals of the widget with CSS.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, events, or custom CSS properties.*


---
*Generated with @webwriter/build@1.15.0*
