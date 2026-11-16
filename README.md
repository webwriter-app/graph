# Graph (`@webwriter/graph@2.0.0`)
[License: MIT](LICENSE) | Version: 2.0.0

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
| `localize` | - | - | - | ✗ |
| `msg` | - | - | - | ✗ |
| `access` | `PermissionsType` | Controls which features are available to the user (editing, algorithm execution, animation playback). | - | ✗ |
| `animation` | `AnimationStep[]` | Array of animation steps. Each step can color nodes/links, set node subtexts, or reset previous steps. | `[]` | ✗ |
| `graph` | `iGraph` | The graph data, containing labeled nodes and weighted links. | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `configurePermissions` | - | -
| `animateStep` | Applies a single animation step to the graph immediately. | `step: AnimationStep`, `signal: AbortSignal`
| `previewStep` | Shows the final state of a single animation step without playing the transition animation. Used when editing steps. | `step: AnimationStep`
| `resetGraph` | Resets the graph SVG layout by briefly clearing and restoring the graph data, triggering a re-render. | -
| `executeAlgorithm` | Runs the currently selected algorithm on the graph and starts playing the resulting animation. | -
| `startAnimation` | Starts or resumes the animation playback from the current position. | -

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, events, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.9.1*