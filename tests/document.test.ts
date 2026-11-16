/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { blockOf, cleanup, data, frame, holder, mount, topBar, until } from "./helpers";

mocha.setup(getMochaConfig());

describe("<ww-graph> document", function () {
  this.timeout(30000);
  afterEach(cleanup);

  describe("data", function () {
    it("reads the block into graph, animation and access", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph from block");
      assert.equal(el.graph.links.length, 2, "links");
      assert.equal(el.access.algorithm.executable.length, 3, "access from block");
      assert.isTrue(!("permissions" in el) || el.permissions === undefined, "no public permissions member");
    });

    it("writes the block on add-node and keeps slot=data and the format", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph");
      el.dispatchEvent(new CustomEvent("add-node"));
      const parsed = await until(() => { const v = JSON.parse(blockOf(el).textContent!); return v.graph.nodes.length === 4 && v; }, "block write");
      assert.equal(Object.keys(parsed).sort().join(), "animation,graph,permissions", "keys " + Object.keys(parsed));
      assert.isTrue(blockOf(el).slot === "data" && el.querySelectorAll("script").length === 1, "one data block with slot=data");
      assert.isTrue(parsed.graph.nodes.every((n: any) => Object.keys(n).sort().join() === "id,name"), "node shape");
    });

    it("writes a permission change and reads one outside change of the block back", async function () {
      const el = await mount();
      await until(() => el.graph.nodes.length === 3, "graph");
      el.shadowRoot.querySelector("options-component").dispatchEvent(new CustomEvent("permission-change", { bubbles: true, composed: true, detail: { group: "general", id: "playbackRate", value: false } }));
      await until(() => JSON.parse(blockOf(el).textContent!).permissions.general.playbackRate === false, "permission written");
      const next = { ...JSON.parse(blockOf(el).textContent!), graph: { nodes: [{ id: 0, name: "Z" }], links: [] } };
      blockOf(el).textContent = JSON.stringify(next);
      await until(() => el.graph.nodes.length === 1 && el.graph.nodes[0].name === "Z", "outside change read");
    });

    it("renders the defaults of a pristine widget and creates the block on its first change", async function () {
      const root = holder();
      root.innerHTML = `<ww-graph></ww-graph>`;
      const el = root.firstElementChild as any;
      await until(() => el.shadowRoot && el.shadowRoot.querySelector("display-graph"), "render");
      await frame(); await frame();
      assert.isTrue(el.graph.nodes.length === 0 && el.access.edit.enabled === true, "defaults");
      el.dispatchEvent(new CustomEvent("add-node"));
      await until(() => blockOf(el) && JSON.parse(blockOf(el).textContent!).graph.nodes.length === 1, "first write creates the block");
      assert.equal(blockOf(el).slot, "data");
    });

    it("ignores a block that is not valid JSON and does not overwrite it while idle", async function () {
      const root = holder();
      root.innerHTML = `<ww-graph><script type="application/json" slot="data">{broken</script></ww-graph>`;
      const el = root.firstElementChild as any;
      await until(() => el.shadowRoot && el.shadowRoot.querySelector("display-graph"), "render");
      await frame(); await frame();
      assert.equal(blockOf(el).textContent, "{broken", "block untouched");
    });
  });

  describe("permissions", function () {
    it("hides the dialog for readers and shows it in edit mode", async function () {
      const el = await mount();
      const dialog = () => el.shadowRoot.querySelector("sl-dialog");
      assert.isTrue(dialog() && getComputedStyle(dialog()).display === "none", "hidden in read mode");
      el.setAttribute("contenteditable", ""); document.designMode = "on";
      await until(() => getComputedStyle(dialog()).display !== "none", "visible in edit mode");
      el.configurePermissions();
      await until(() => dialog().open === true, "dialog opens through the action");
      document.designMode = "off"; el.removeAttribute("contenteditable");
      await until(() => getComputedStyle(dialog()).display === "none", "hidden again");
    });
  });

  describe("localize", function () {
    it("selects the catalog for the widget and its components by lang", async function () {
      const el = await mount('lang="de"');
      await until(() => /Hinzuf/i.test(topBar(el).shadowRoot.textContent) || /Knoten/i.test(topBar(el).shadowRoot.textContent), "German top bar");
      assert.notMatch(topBar(el).shadowRoot.textContent, /Add node/, "English text gone");
      el.setAttribute("lang", "en");
      await until(() => /Add node/.test(topBar(el).shadowRoot.textContent), "back to English");
      el.setAttribute("lang", "fr");
      await until(() => !/Add node/.test(topBar(el).shadowRoot.textContent), "French");
    });

    it("lets the action label follow the language", async function () {
      const el = await mount('lang="de"');
      await until(() => el.actions.configurePermissions.label === "Graphberechtigungen konfigurieren", "German action label");
      assert.equal(el.constructor.actions.configurePermissions.label({ msg: (s: string) => s }), "Configure graph permissions", "static source label");
    });

    it("does not write lang onto the widget and applies an inherited language", async function () {
      const root = holder();
      root.innerHTML = `<div lang="de"><ww-graph><script type="application/json" slot="data">${JSON.stringify(data)}</script></ww-graph></div>`;
      const el = root.querySelector("ww-graph") as any;
      await until(() => el.shadowRoot && el.shadowRoot.querySelector("top-bar"), "render");
      assert.isFalse(el.hasAttribute("lang"), "no lang attribute added");
      await until(() => !/Add node/.test(topBar(el).shadowRoot.textContent), "inherited German");
    });
  });
});

mocha.run();
