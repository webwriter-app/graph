/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { centre, cleanup, data, frame, holder, laidOut, mount, node, topBar, until, view } from "./helpers";

mocha.setup(getMochaConfig());

const touch = (target: Element, type: string, at: { x: number; y: number }) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerId: 11, pointerType: "touch", button: 0, isPrimary: true, clientX: at.x, clientY: at.y }));

const key = (target: Element, name: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true }));
  target.dispatchEvent(new KeyboardEvent("keyup", { key: name, bubbles: true, composed: true, cancelable: true }));
};

describe("<ww-graph> input, layout and theme", function () {
  this.timeout(30000);
  afterEach(cleanup);

  it("selects a node by touch tap and moves it by touch drag", async function () {
    const el = await mount();
    await laidOut(el);
    const target = node(el, 1);
    const from = centre(target);
    touch(target, "pointerdown", from);
    touch(target, "pointerup", from);
    await until(() => node(el, 1).hasAttribute("selected"), "node selected by tap");
    const x = Number(node(el, 1).getAttribute("x"));
    touch(target, "pointerdown", from);
    touch(target, "pointermove", { x: from.x + 6, y: from.y + 6 });
    await frame(); await frame();
    touch(target, "pointermove", { x: from.x + 60, y: from.y });
    await frame(); await frame();
    touch(target, "pointerup", { x: from.x + 60, y: from.y });
    await until(() => Math.abs(Number(node(el, 1).getAttribute("x")) - (x + 60)) < 2, "node moved by touch");
  });

  it("reaches nodes with the keyboard and selects one with Enter", async function () {
    const el = await mount();
    await laidOut(el);
    const target = node(el, 2) as HTMLElement;
    assert.isAtLeast(target.tabIndex, 0, "node is a tab stop");
    target.focus();
    key(target, "Enter");
    await until(() => node(el, 2).hasAttribute("selected"), "node selected by Enter");
  });

  it("moves a focused node with the arrow keys", async function () {
    const el = await mount();
    await laidOut(el);
    const target = node(el, 0) as HTMLElement;
    const x = Number(target.getAttribute("x"));
    target.focus();
    key(target, "Enter");
    await until(() => node(el, 0).hasAttribute("selected"), "node selected");
    key(target, "ArrowRight");
    await until(() => Number(node(el, 0).getAttribute("x")) > x, "node moved right by keyboard");
  });

  it("adds an edge with the keyboard: Add edge, Enter on a node, an arrow to the target, Enter", async function () {
    const el = await mount("contenteditable", { ...data, graph: { nodes: data.graph.nodes, links: [{ source: 0, target: 1, weight: 2 }] } });
    await laidOut(el);
    const add = [...topBar(el).shadowRoot.querySelectorAll("sl-button")].find((b: any) => b.textContent.includes("Add edge")) as HTMLElement;
    add.click();
    await until(() => el.addingEdge, "edge mode");
    const from = node(el, 2) as HTMLElement;
    from.focus();
    key(from, "Enter");
    key(from, "ArrowRight");
    key(from, "Enter");
    await until(() => el.graph.links.length === 2, "edge added");
  });

  it("offers the toolbar controls as labelled buttons of at least 24 px", async function () {
    const el = await mount();
    await laidOut(el);
    const buttons = [...topBar(el).shadowRoot.querySelectorAll("sl-button")] as HTMLElement[];
    assert.isAbove(buttons.length, 2, "buttons");
    for (const button of buttons) {
      const box = button.getBoundingClientRect();
      assert.isAtLeast(box.height, 24, "button height");
      assert.isAtLeast(box.width, 24, "button width");
      assert.isOk(button.textContent!.trim() || button.getAttribute("aria-label"), "button has a label");
    }
  });

  it("fits 300 px without scrolling sideways and keeps the scene shorter than at full width", async function () {
    const narrow = await mount();
    narrow.style.width = "300px";
    await laidOut(narrow);
    await until(() => view(narrow).getBoundingClientRect().height <= 580, "narrow scene height");
    assert.isAtMost(narrow.scrollWidth, narrow.clientWidth + 1, "no sideways scroll");
    assert.isAtMost(narrow.getBoundingClientRect().width, 300 + 1);
    narrow.style.width = "900px";
    await until(() => view(narrow).getBoundingClientRect().height >= 590, "wide scene height");
  });

  it("follows the theme properties of the page and keeps the default look without them", async function () {
    const el = await mount();
    await laidOut(el);
    const plain = getComputedStyle(el).color;
    const wrapper = holder();
    wrapper.style.cssText = "--ww-text-color: rgb(10, 20, 30); --ww-font-family: Georgia, serif; --ww-theme-accent-1: rgb(200, 10, 10)";
    await frame();
    assert.equal(getComputedStyle(el).color, "rgb(10, 20, 30)");
    assert.include(getComputedStyle(el).fontFamily, "Georgia");
    node(el, 0).setAttribute("selected", "");
    await frame();
    await until(() => getComputedStyle(node(el, 0).querySelector(".disc")!).backgroundColor === "rgb(200, 10, 10)", "accent on a selected node");
    wrapper.style.cssText = "";
    await frame();
    assert.equal(getComputedStyle(el).color, plain, "default text color");
  });

  it("exposes the graph area and the node discs as parts", async function () {
    const el = await mount();
    await laidOut(el);
    assert.isOk(el.shadowRoot.querySelector('[part="graph"]'));
    assert.equal(view(el).getAttribute("exportparts"), "node");
    assert.isOk(view(el).shadowRoot.querySelector('.disc[part="node"]'));
    assert.deepEqual(data.graph.nodes.length, 3);
  });
});

mocha.run();
