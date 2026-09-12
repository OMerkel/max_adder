import { describe, expect, it } from "vitest";
import { createRenderer } from "../../js/renderer.js";

class FakeElement {
	constructor(tagName) {
		this.tagName = tagName;
		this.children = [];
		this.parentNode = null;
		this.attributes = new Map();
		this.dataset = {};
		this.style = {};
		this.textContent = "";
	}

	appendChild(child) {
		child.parentNode = this;
		this.children.push(child);
		return child;
	}

	removeChild(child) {
		const index = this.children.indexOf(child);
		if (index >= 0) this.children.splice(index, 1);
		child.parentNode = null;
		return child;
	}

	get firstChild() {
		return this.children[0] ?? null;
	}

	setAttribute(name, value) {
		this.attributes.set(name, String(value));
	}

	getAttribute(name) {
		return this.attributes.get(name) ?? null;
	}

	addEventListener() {}
	removeEventListener() {}
}

const collectByTag = (node, tagName, acc = []) => {
	if (node.tagName === tagName) acc.push(node);
	node.children.forEach((child) => {
		collectByTag(child, tagName, acc);
	});
	return acc;
};

const board = (overrides = {}) => ({
	tiles: Array.from({ length: 8 }, () => Array(8).fill(null)),
	marker: { row: 5, col: 0 },
	roles: ["horizontal", "vertical"],
	active: 0,
	phase: "regular",
	result: null,
	latestMove: null,
	...overrides,
});

describe("renderer", () => {
	it("renders remaining number tiles and the shared marker", () => {
		const originalDocument = globalThis.document;
		globalThis.document = {
			createElementNS: (_namespace, tagName) => new FakeElement(tagName),
		};

		try {
			const container = new FakeElement("div");
			const renderer = createRenderer(container, () => {});
			const tiles = Array.from({ length: 8 }, () => Array(8).fill(null));
			tiles[2][3] = -1;
			renderer.render(board({ tiles }));
			const texts = collectByTag(container, "text");
			expect(texts.some((element) => element.textContent === "-1")).toBe(true);
			expect(collectByTag(container, "circle")).toHaveLength(1);
		} finally {
			globalThis.document = originalDocument;
		}
	});

	it("uses smaller fonts for middle values and larger fonts for extremes", () => {
		const originalDocument = globalThis.document;
		globalThis.document = {
			createElementNS: (_namespace, tagName) => new FakeElement(tagName),
		};

		try {
			const container = new FakeElement("div");
			const renderer = createRenderer(container, () => {});
			const tiles = Array.from({ length: 8 }, () => Array(8).fill(null));
			tiles[0][0] = -2;
			tiles[0][1] = 3;
			tiles[0][2] = 8;
			renderer.render(board({ tiles }));
			const tileTexts = collectByTag(container, "text").filter((element) => element.dataset.row !== undefined);
			const fontSize = (value) => Number(tileTexts.find((element) => element.textContent === String(value)).getAttribute("style").match(/700 (\d+)px/)[1]);
			expect(fontSize(3)).toBeLessThan(fontSize(-2));
			expect(fontSize(3)).toBeLessThan(fontSize(8));
			expect(fontSize(-2)).toBe(fontSize(8));
		} finally {
			globalThis.document = originalDocument;
		}
	});

	it("labels the board as Max Adder and keeps coordinate annotations", () => {
		const originalDocument = globalThis.document;
		globalThis.document = {
			createElementNS: (_namespace, tagName) => new FakeElement(tagName),
		};

		try {
			const container = new FakeElement("div");
			createRenderer(container, () => {});
			const svg = container.children[0];
			expect(svg.getAttribute("aria-label")).toBe("Max Adder board");
			expect(collectByTag(container, "text")).toHaveLength(33);
		} finally {
			globalThis.document = originalDocument;
		}
	});

	it("formats the winner status with the player indicator", () => {
		const originalDocument = globalThis.document;
		globalThis.document = {
			createElementNS: (_namespace, tagName) => new FakeElement(tagName),
		};

		try {
			const container = new FakeElement("div");
			const renderer = createRenderer(container, () => {});
			renderer.render(board({
				roles: ["horizontal", "vertical"],
				playerTypes: ["Human", "AI"],
				result: { winner: 0, reason: "all_tiles_scored" },
			}));
			const status = collectByTag(container, "text").find(
				(element) => element.getAttribute("id") === "board-status",
			);
			expect(status.textContent).toBe("Player 🧑▼ wins!");
		} finally {
			globalThis.document = originalDocument;
		}
	});
});
