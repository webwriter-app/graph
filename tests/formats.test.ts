/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { computed, signal } from "@webwriter/lit";
import { formatCsv, fromDot, fromRows, parseCsv, toAdjacencyMatrix, toDot, toEdgeList } from "../src/model/formats";
import { cleanup, data, mount, until } from "./helpers";
import { digraph, dot, edgeList, matrix } from "./fixtures";

mocha.setup(getMochaConfig());

const errors = { emptyFile: "empty", invalidDot: "dot", invalidTable: "table", invalidWeight: "weight" };
const names = (graph: any) => graph.nodes.map((n: any) => n.name);
const pairs = (graph: any) => graph.links.map((l: any) => `${graph.nodes.find((n: any) => n.id === l.source).name}-${graph.nodes.find((n: any) => n.id === l.target).name}:${l.weight}`);

const widget = customElements.get("ww-graph") as any;
const from = (el: any, key: string) => widget.convertFrom[key].bind(el);
const to = (el: any, key: string) => widget.convertTo[key].bind(el);

describe("<ww-graph> formats", function () {
  this.timeout(30000);
  afterEach(cleanup);

  describe("DOT", function () {
    it("imports labels, weights and chains", function () {
      const graph = fromDot(dot, errors);
      assert.deepEqual(names(graph), ["Aachen", "Cologne", "d", "solo"]);
      assert.deepEqual(pairs(graph), ["Aachen-Cologne:70", "Cologne-d:40", "Aachen-d:1"]);
    });

    it("reads a digraph without directions", function () {
      assert.deepEqual(pairs(fromDot(digraph, errors)), ["a-b:3", "b-c:3"]);
    });

    it("rejects input that is not a graph and subgraphs", function () {
      assert.throws(() => fromDot("hello", errors), "dot");
      assert.throws(() => fromDot("graph { subgraph x { a } }", errors), "dot");
      assert.throws(() => fromDot("graph { a -- b [weight=-2] }", errors), "weight");
    });

    it("round trips names and weights", function () {
      const graph = fromDot(dot, errors);
      const again = fromDot(toDot(graph), errors);
      assert.deepEqual(names(again), names(graph));
      assert.deepEqual(pairs(again), pairs(graph));
    });
  });

  describe("CSV and tables", function () {
    it("imports an edge list with quoted fields and a lone node", function () {
      const graph = fromRows(parseCsv(edgeList), errors);
      assert.deepEqual(names(graph).sort(), ["Aachen", "Cologne", "Cologne, Rhine", "Duesseldorf", "Hamburg"]);
      assert.deepEqual(pairs(graph), ["Aachen-Cologne:70", "Cologne, Rhine-Duesseldorf:40"]);
    });

    it("round trips the edge list and the adjacency matrix", function () {
      const graph = fromRows(parseCsv(edgeList), errors);
      const list = fromRows(parseCsv(formatCsv(toEdgeList(graph))), errors);
      assert.deepEqual([names(list), pairs(list)], [names(graph), pairs(graph)]);
      const grid = fromRows(parseCsv(matrix), errors);
      assert.deepEqual(pairs(grid), ["A-B:2", "B-C:3"]);
      assert.equal(formatCsv(toAdjacencyMatrix(grid)).replace(/\r/g, ""), matrix);
    });

    it("ignores the diagonal of a matrix and keeps the weight above it", function () {
      const grid = fromRows(parseCsv(",A,B\nA,5,2\nB,7,"), errors);
      assert.deepEqual(pairs(grid), ["A-B:2"]);
    });

    it("rejects empty and malformed tables", function () {
      assert.throws(() => fromRows(parseCsv(""), errors), "empty");
      assert.throws(() => fromRows(parseCsv(",A,B\nA,,1"), errors), "table");
      assert.throws(() => fromRows(parseCsv("source,target,weight\nA,B,x"), errors), "weight");
    });
  });

  describe("widget", function () {
    const file = (text: string, name: string) => new File([text], name);

    it("imports a DOT file only when the apply function runs, and clears the animation", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph");
      el.animation = [{ type: "reset", data: { nodes: true } }];
      const apply = await from(el, ".gv")(file(dot, "roads.gv"));
      assert.equal(el.graph.nodes.length, 3, "unchanged before apply");
      apply();
      await until(() => el.graph.nodes.length === 4, "graph replaced");
      assert.equal(el.animation.length, 0);
      const stored = await until(() => { const v = JSON.parse(el.querySelector('script[slot="data"]').textContent); return v.graph.nodes.length === 4 && v; }, "block written");
      assert.equal(stored.animation.length, 0);
    });

    it("rejects an invalid file with a message and leaves the graph", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph");
      let message = "";
      try { await from(el, ".csv")(file("source,target\n,B", "x.csv")); } catch (error: any) { message = error.message; }
      assert.include(message, "edge list");
      assert.equal(el.graph.nodes.length, 3);
    });

    it("exports DOT and CSV and imports its own export", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph");
      for (const [key, name, type] of [[".gv", "graph.gv", "text/vnd.graphviz"], [".csv", "graph.csv", "text/csv"]]) {
        const out: File = to(el, key)();
        assert.equal(out.name, name);
        assert.equal(out.type, type);
        const text = await out.text();
        const apply = await from(el, key)(file(text, name));
        apply();
        await until(() => el.graph.nodes.length === 3, "graph after import");
        assert.deepEqual(pairs(el.graph), pairs(data.graph), key);
      }
    });

    it("converts a table to a graph and the graph to a table", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph");
      const source = document.createElement("table");
      source.innerHTML = "<tbody><tr><td>source</td><td>target</td><td>weight</td></tr><tr><td>P</td><td>Q</td><td>5</td></tr></tbody>";
      const fragment = document.createDocumentFragment();
      fragment.append(source);
      assert.isTrue(from(el, "table")(fragment));
      await until(() => el.graph.nodes.length === 2, "graph from table");
      assert.deepEqual(pairs(el.graph), ["P-Q:5"]);
      const table = to(el, "table")() as HTMLTableElement;
      assert.equal(table.tagName, "TABLE");
      assert.deepEqual(Array.from(table.querySelectorAll("tr"), (r) => Array.from(r.children, (c) => c.textContent)), [["", "P", "Q"], ["P", "", "5"], ["Q", "5", ""]]);
      const bad = document.createDocumentFragment();
      bad.append(document.createElement("table"));
      assert.isFalse(from(el, "table")(bad));
      assert.equal(el.graph.nodes.length, 2, "declined input changes nothing");
    });

    it("declares its formats", function () {
      const klass = customElements.get("ww-graph") as any;
      assert.hasAllKeys(klass.convertFrom, ["table", ".gv", ".dot", ".csv"]);
      assert.hasAllKeys(klass.convertTo, ["table", ".gv", ".csv"]);
    });
  });

  describe("signals", function () {
    it("publishes the node count and the edge table and follows the graph", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph");
      const { nodeCount, edges } = el.signals;
      assert.equal(nodeCount.get(), 3);
      assert.deepEqual(edges.get(), { columns: ["source", "target", "weight"], rows: [["A", "B", 2], ["B", "C", 3]] });
      el.dispatchEvent(new CustomEvent("add-node"));
      await until(() => el.signals.nodeCount.get() === 4, "count follows");
      assert.strictEqual(el.signals.nodeCount, nodeCount, "stable instance");
    });

    it("lets a receiver read the signal and stop when the lifetime aborts", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph");
      const received = signal<any>(null);
      const lifetime = new AbortController();
      const connect = (source: any, signalLifetime: AbortSignal) => {
        received.set(source);
        signalLifetime.addEventListener("abort", () => received.set(null), { once: true });
      };
      connect(el.signals.nodeCount, lifetime.signal);
      const shown = computed(() => received.get()?.get() ?? "disconnected");
      assert.equal(shown.get(), 3);
      el.dispatchEvent(new CustomEvent("add-node"));
      await until(() => shown.get() === 4, "receiver updated");
      lifetime.abort();
      assert.equal(shown.get(), "disconnected");
    });
  });
});

mocha.run();
