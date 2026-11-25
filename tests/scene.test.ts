/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { blockOf, centre, cleanup, click, disc, drag, edge, frame, laidOut, mount, node, pointer, scene, until, view } from "./helpers";

mocha.setup(getMochaConfig());

describe("<ww-graph> scene", function () {
  this.timeout(30000);
  afterEach(cleanup);

  it("draws the graph as nodes and paths on a ww-scene, without svg of its own", async function () {
    const el = await mount();
    await laidOut(el);
    assert.isOk(scene(el), "ww-scene");
    assert.isNull(view(el).shadowRoot.querySelector("svg.chart"), "no d3 svg");
    assert.equal(view(el).shadowRoot.querySelectorAll("ww-path[data-ww-key]").length, 2, "one path per edge");
    assert.isTrue(edge(el, "0-1").getAttribute("from") === "0" && edge(el, "0-1").getAttribute("to") === "1", "path ends are node keys");
    assert.isTrue(["A", "B", "C"].every((name, i) => disc(el, i).textContent.trim() === name), "node labels");
    assert.isTrue(["2", "3"].every((w) => [...view(el).shadowRoot.querySelectorAll("ww-text")].some((t: any) => t.textContent.trim() === w)), "weight labels");
    const width = scene(el).getBoundingClientRect().width;
    assert.isTrue([0, 1, 2].every((i) => { const r = node(el, i).getBoundingClientRect(); return r.left >= 0 && r.right <= width + 1; }), "nodes inside the scene");
  });

  for (const mode of ["read", "edit"]) {
    describe(mode + " mode", function () {
      const open = async () => {
        const el = await mount(mode === "edit" ? "contenteditable" : "");
        if (mode === "edit") document.designMode = "on";
        await laidOut(el);
        return el;
      };

      it("moves a dragged node as one transaction and writes nothing to the block", async function () {
        const el = await open();
        const before = blockOf(el).textContent;
        const log: string[] = [];
        for (const type of ["ww-transactionstart", "ww-move", "ww-transactionend"]) el.addEventListener(type, () => log.push(type));
        const x = Number(node(el, 1).getAttribute("x"));
        await drag(node(el, 1), 60, 0);
        await until(() => Math.abs(Number(node(el, 1).getAttribute("x")) - (x + 60)) < 2, "node moved by 60 from " + x + " now " + node(el, 1).getAttribute("x"));
        assert.equal(log.join(), "ww-transactionstart,ww-move,ww-transactionend", "events " + log);
        const at = centre(node(el, 1));
        const line = edge(el, "0-1");
        assert.isTrue(line && line.getAttribute("from") === "0", "the path stays attached to the keys");
        assert.isAbove(at.x, 0, "node still rendered");
        await frame(); await frame();
        assert.equal(blockOf(el).textContent, before, "positions are not part of the document");
      });

      it("selects a clicked node and clears on a click on the background", async function () {
        const el = await open();
        await click(node(el, 0));
        await until(() => node(el, 0).hasAttribute("selected"), "node selected");
        await until(() => el.shadowRoot.querySelector("edit-bar").selectedNode === 0, "edit bar knows the node");
        await click(edge(el, "1-2"));
        await until(() => edge(el, "1-2").hasAttribute("selected") && !node(el, 0).hasAttribute("selected"), "edge replaces node");
        const empty = scene(el).getBoundingClientRect();
        const at = { x: empty.left + 5, y: empty.bottom - 5 };
        pointer(scene(el), "pointerdown", at); pointer(scene(el), "pointerup", at);
        await until(() => !edge(el, "1-2").hasAttribute("selected"), "background clears");
      });

      it("connects two nodes after add-edge and two clicks and writes the block", async function () {
        const el = await open();
        el.dispatchEvent(new CustomEvent("add-edge"));
        await frame();
        await until(() => node(el, 0).hasAttribute("data-ww-link"), "nodes take wires while an edge is added");
        await click(node(el, 0));
        const at = { x: centre(node(el, 0)).x + 40, y: centre(node(el, 0)).y + 40 };
        window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: at.x, clientY: at.y }));
        await until(() => scene(el).hasAttribute("connect-click") && scene(el).matches(":state(wiring)"), "the scene holds the pending wire");
        await click(node(el, 2));
        const parsed = await until(() => { const v = JSON.parse(blockOf(el).textContent!); return v.graph.links.length === 3 && v; }, "edge written");
        assert.isTrue(parsed.graph.links.some((l: any) => l.source === 0 && l.target === 2 && l.weight === 1), "new link " + JSON.stringify(parsed.graph.links));
        await until(() => edge(el, "0-2"), "path for the new edge");
        await until(() => !node(el, 0).hasAttribute("data-ww-link") && !scene(el).matches(":state(wiring)"), "mode ended");
        await until(() => edge(el, "0-2").hasAttribute("selected"), "new edge selected");
      });

      it("reports a click on a node that is selected already", async function () {
        const el = await open();
        const picks: string[] = [];
        el.addEventListener("graph-pick", (event: CustomEvent) => picks.push(event.detail.type + ":" + event.detail.id));
        await click(node(el, 0));
        await click(node(el, 0));
        assert.equal(picks.join(), "NODE:0,NODE:0", "both clicks arrive");
      });

      it("keeps the weight as a label of its path, with no tab stop of its own", async function () {
        const el = await open();
        const label = edge(el, "0-1").querySelector("ww-text");
        assert.equal(label?.textContent?.trim(), "2", "label inside the path");
        assert.isNull(view(el).shadowRoot.querySelector("ww-scene > ww-text"), "no text of its own in the scene");
        const a = centre(node(el, 0)), b = centre(node(el, 1));
        const at = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const picks: string[] = [];
        el.addEventListener("graph-pick", (event: CustomEvent) => picks.push(JSON.stringify(event.detail)));
        pointer(edge(el, "0-1"), "pointerdown", at); pointer(edge(el, "0-1"), "pointerup", at);
        await until(() => picks.length, "a pick");
        assert.equal(picks[0], JSON.stringify({ type: "LINK", source: 0, target: 1 }), "a click on the middle of the path, where the label is, picks the edge");
      });

      it("lets the other nodes follow a node that is dragged, and puts them back when the move is cancelled", async function () {
        const el = await open();
        const where = (id: number) => `${node(el, id).getAttribute("x")},${node(el, id).getAttribute("y")}`;
        const others = () => `${where(0)}|${where(2)}`;
        const before = others();
        const from = centre(node(el, 1));
        pointer(node(el, 1), "pointerdown", from);
        pointer(node(el, 1), "pointermove", { x: from.x + 6, y: from.y + 6 });
        await frame();
        pointer(node(el, 1), "pointermove", { x: from.x - 120, y: from.y + 150 });
        await until(() => others() !== before, "the others moved during the drag");
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        pointer(node(el, 1), "pointerup", { x: from.x - 120, y: from.y + 150 });
        await until(() => others() === before, "the others are back");
      });

      it("removes a deleted selected node and its paths", async function () {
        const el = await open();
        await click(node(el, 1));
        await until(() => el.shadowRoot.querySelector("edit-bar").selectedNode === 1, "selected");
        const bar = el.shadowRoot.querySelector("edit-bar");
        await until(() => bar.shadowRoot.querySelector('sl-button[variant="danger"]'), "delete button");
        bar.shadowRoot.querySelector('sl-button[variant="danger"]').click();
        const parsed = await until(() => { const v = JSON.parse(blockOf(el).textContent!); return v.graph.nodes.length === 2 && v; }, "node removed from the block");
        assert.equal(parsed.graph.links.length, 0, "its edges went with it");
        await until(() => view(el).shadowRoot.querySelectorAll("ww-node").length === 2 && view(el).shadowRoot.querySelectorAll("ww-path[data-ww-key]").length === 0, "scene updated");
      });
    });
  }

  describe("animation", function () {
    it("colors nodes in a node step, edges in a link step, shows a subtext step under the name and clears on reset", async function () {
      const el = await mount();
      await laidOut(el);
      el.animateStep({ type: "node", data: { names: [1], colors: ["#22c55e"] } });
      await until(() => getComputedStyle(disc(el, 1)).backgroundColor === "rgb(34, 197, 94)", "node colored");
      assert.equal(getComputedStyle(disc(el, 0)).backgroundColor, "rgb(255, 255, 255)", "other node untouched");
      el.animateStep({ type: "link", data: { links: [{ source: 2, target: 1 }], colors: ["#ef4444"] } });
      await until(() => edge(el, "1-2").getAttribute("style").includes("#ef4444"), "link colored in either direction");
      el.animateStep({ type: "subtext", data: { nodes: [0], texts: ["7"] } });
      await until(() => disc(el, 0).textContent.replace(/\s+/g, "") === "A7", "subtext shown");
      el.animateStep({ type: "reset", data: { nodes: true, links: true, subtexts: true } });
      await until(() => getComputedStyle(disc(el, 1)).backgroundColor === "rgb(255, 255, 255)" && !edge(el, "1-2").hasAttribute("style") && disc(el, 0).textContent.trim() === "A", "reset");
    });

    it("toggles a clicked node in a node step and in the block", async function () {
      const el = await mount();
      await laidOut(el);
      el.shadowRoot.querySelector("top-bar").dispatchEvent(new CustomEvent("mode-change", { bubbles: true, composed: true, detail: { mode: "animation" } }));
      el.animation = [{ type: "node", data: { names: [], colors: [] } }];
      await el.updateComplete;
      el.shadowRoot.querySelector("animation-bar").dispatchEvent(new CustomEvent("select-step", { bubbles: true, composed: true, detail: 0 }));
      await until(() => el.selectedAnimationStep === 0, "step selected");
      await click(node(el, 2));
      await until(() => el.animation[0].data.names.join() === "2", "node added to the step");
      await until(() => getComputedStyle(disc(el, 2)).backgroundColor !== "rgb(255, 255, 255)", "preview colors it");
      await click(node(el, 2));
      await until(() => el.animation[0].data.names.length === 0, "node removed again");
      await until(() => JSON.parse(blockOf(el).textContent!).animation[0].data.names.length === 0, "block follows");
    });
  });

  describe("layout", function () {
    it("keeps edited labels and positions when only a name changes", async function () {
      const el = await mount();
      await laidOut(el);
      await drag(node(el, 0), 40, 30);
      const x = node(el, 0).getAttribute("x");
      el.graph = { nodes: [{ id: 0, name: "Q" }, { id: 1, name: "B" }, { id: 2, name: "C" }], links: el.graph.links };
      await until(() => disc(el, 0).textContent.trim() === "Q", "renamed");
      assert.equal(node(el, 0).getAttribute("x"), x, "rename does not move nodes");
    });
  });
});

mocha.run();
