import { describe, expect, it } from "vitest";
import { Board } from "../../js/board.js";
import { Uct } from "../../js/uct/uct.js";
import { UctNode } from "../../js/uct/uctnode.js";

const boardStub = (actions, active = 0) => ({
	getActions: () => [...actions],
	active,
	copy() {
		return boardStub(actions, active);
	},
	doAction() {},
	getResult: () => [0.01, 0.01],
});

class TinyDeterministicGame {
	constructor(state = { ply: 0, active: 0, winner: null }) {
		this.state = { ...state };
	}

	get active() {
		return this.state.active;
	}

	copy() {
		return new TinyDeterministicGame(this.state);
	}

	getActions() {
		if (this.state.winner !== null) return [];
		if (this.state.ply === 0) return ["safe", "blunder"];
		if (this.state.ply === 1)
			return this.state.last === "blunder" ? ["punish"] : ["drift"];
		return [];
	}

	doAction(action) {
		if (this.state.winner !== null) return;
		if (this.state.ply === 0) {
			this.state = { ...this.state, ply: 1, last: action, active: 1 };
			return;
		}
		if (this.state.ply === 1) {
			const winner = this.state.last === "blunder" ? 1 : null;
			this.state = { ...this.state, ply: 2, active: 0, winner };
		}
	}

	getResult() {
		if (this.state.winner === 0) return [1, 0];
		if (this.state.winner === 1) return [0, 1];
		if (this.state.ply >= 2) return [0.5, 0.5];
		return [0.01, 0.01];
	}
}

describe("UctNode", () => {
	it("stores action and unexamined moves from board", () => {
		const node = new UctNode(null, boardStub(["a", "b", "c"]), null);
		expect(node.unexamined).toEqual(["a", "b", "c"]);
		expect(node.activePlayer).toBe(0);
	});

	it("adds child and removes action from unexamined list", () => {
		const node = new UctNode(null, boardStub(["x", "y", "z"]), null);
		const child = node.addChild(boardStub([], 1), 1);
		expect(child.action).toBe("y");
		expect(node.unexamined).toEqual(["x", "z"]);
	});

	it("selects child with highest UCB1 value", () => {
		const parent = new UctNode(null, boardStub(["left", "right"]), null);
		parent.visits = 10;

		const c0 = parent.addChild(boardStub([]), 0);
		c0.wins = 8;
		c0.visits = 10;

		const c1 = parent.addChild(boardStub([]), 0);
		c1.wins = 1;
		c1.visits = 1;

		expect(parent.selectChild()).toBe(c1);
	});

	it("returns no child when no child has been added", () => {
		const node = new UctNode(null, boardStub(["only"]), null);
		expect(node.mostVisitedChild()).toBeNull();
	});

	it("keeps the first child when a later child has fewer visits", () => {
		const node = new UctNode(null, boardStub(["first", "second"]), null);
		const first = node.addChild(boardStub([]), 0);
		const second = node.addChild(boardStub([]), 0);
		first.visits = 2;
		second.visits = 1;
		expect(node.mostVisitedChild()).toBe(first);
	});
});

describe("Uct.getActionInfo", () => {
	const uct = new Uct();

	it("returns null when no legal action exists", () => {
		const board = boardStub([]);
		const result = uct.getActionInfo(board, 500, 50, 5, 10);
		expect(result.action).toBeNull();
		expect(result.info).toMatch(/no action/i);
	});

	it("returns the only legal action directly", () => {
		const board = boardStub(["only"]);
		const result = uct.getActionInfo(board, 500, 50, 5, 10);
		expect(result.action).toBe("only");
		expect(result.info).toMatch(/1 action/i);
	});

	it("falls back to the first action when the search budget is zero", () => {
		const result = uct.getActionInfo(
			boardStub(["first", "second"]),
			0,
			0,
			1,
			1,
		);
		expect(result.action).toBe("first");
		expect(result.info).toMatch(/fallback/i);
	});

	it("returns null fallback action when the first fallback entry is undefined", () => {
		const result = uct.getActionInfo(
			boardStub([undefined, "second"]),
			0,
			0,
			1,
			1,
		);
		expect(result.action).toBeNull();
	});

	it("avoids a deterministic blunder in two-ply game", () => {
		const board = new TinyDeterministicGame();
		const result = uct.getActionInfo(board, 6000, 250, 12, 16);
		expect(result.action).toBe("safe");
	});
});

describe("Board adapter x Uct integration", () => {
	it("plays multiple AI moves and keeps cell values valid", () => {
		const uct = new Uct();
		const board = new Board();

		for (let i = 0; i < 18; i++) {
			const { action } = uct.getActionInfo(board, 700, 90, 10, 18);
			if (action === null) break;
			board.doAction(action);
			if (board.getState().result) break;
		}

		const values = board.getState().tiles.flat();
		expect(values.every((value) => value === null || (value >= -2 && value <= 8))).toBe(true);
	});
});
