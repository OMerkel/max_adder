import { describe, expect, it } from "vitest";
import { Board, createBoard, doAction, getActions, getResult } from "../../js/board.js";

const stateWith = (overrides = {}) => ({
	...createBoard(),
	tiles: Array.from({ length: 8 }, () => Array(8).fill(null)),
	marker: { row: 3, col: 3 },
	roles: ["horizontal", "vertical"],
	active: 0,
	phase: "regular",
	...overrides,
});

const tileState = (tiles, overrides = {}) => stateWith({
	tiles: tiles.map((row) => [...row]),
	...overrides,
});

describe("createBoard", () => {
	it("creates an 8x8 board with 64 number tiles", () => {
		const board = createBoard();
		expect(board.tiles).toHaveLength(8);
		expect(board.tiles.flat()).toHaveLength(64);
		expect(board.tiles.flat().every((value) => value >= -2 && value <= 8)).toBe(true);
		expect(board.marker).toBeNull();
		expect(board.phase).toBe("opening");
		expect(board.roles).toEqual(expect.arrayContaining(["horizontal", "vertical"]));
	});
});

describe("opening phase", () => {
	it("offers every remaining tile for the opening placement", () => {
		const board = stateWith({
			phase: "opening",
			marker: null,
			tiles: Array.from({ length: 8 }, () => Array(8).fill(1)),
		});
		expect(getActions(board)).toHaveLength(64);
		expect(getActions(board)[0]).toMatchObject({ type: "place", to: { row: 0, col: 0 } });
	});

	it("places the marker and enters score allocation", () => {
		const board = stateWith({
			phase: "opening",
			marker: null,
			tiles: Array.from({ length: 8 }, () => Array(8).fill(1)),
		});
		const next = doAction(board, { type: "place", to: { row: 3, col: 3 } });
		expect(next.phase).toBe("allocate");
		expect(next.marker).toEqual({ row: 3, col: 3 });
		expect(next.tiles[3][3]).toBeNull();
		expect(next.active).toBe(1 - board.active);
	});

	it("assigns the opening value and starts with the player who did not receive it", () => {
		const board = stateWith({ phase: "allocate", opening: { player: 0, field: { row: 3, col: 3 }, value: 7 } });
		const next = doAction(board, { type: "allocate", recipient: 0 });
		expect(next.scores).toEqual([7, 0]);
		expect(next.phase).toBe("regular");
		expect(next.active).toBe(1);
	});

	it("lets the deciding player move when the opening score goes to the placer", () => {
		const board = stateWith({
			phase: "allocate",
			active: 0,
			opening: { player: 1, field: { row: 3, col: 3 }, value: 7 },
		});
		const next = doAction(board, { type: "allocate", recipient: 1 });
		expect(next.active).toBe(0);
		expect(next.phase).toBe("regular");
	});
});

describe("regular movement and scoring", () => {
	it("moves horizontally and scores the destination tile", () => {
		const tiles = Array.from({ length: 8 }, () => Array(8).fill(null));
		tiles[3][5] = 4;
		const board = tileState(tiles);
		const next = doAction(board, { type: "move", from: { row: 3, col: 3 }, to: { row: 3, col: 5 } });
		expect(next.marker).toEqual({ row: 3, col: 5 });
		expect(next.tiles[3][5]).toBeNull();
		expect(next.scores[0]).toBe(4);
		expect(next.active).toBe(1);
	});

	it("moves vertically for the vertical role", () => {
		const tiles = Array.from({ length: 8 }, () => Array(8).fill(null));
		tiles[6][3] = -1;
		const board = tileState(tiles, { active: 1 });
		const next = doAction(board, { type: "move", from: { row: 3, col: 3 }, to: { row: 6, col: 3 } });
		expect(next.marker).toEqual({ row: 6, col: 3 });
		expect(next.scores[1]).toBe(-1);
	});

	it("rejects a destination outside the active axis", () => {
		const tiles = Array.from({ length: 8 }, () => Array(8).fill(null));
		tiles[5][5] = 4;
		const board = tileState(tiles);
		const next = doAction(board, { type: "move", from: { row: 3, col: 3 }, to: { row: 5, col: 5 } });
		expect(next).toBe(board);
	});
});

describe("results and adapter", () => {
	it("ends when all tiles are scored and awards the higher score", () => {
		const tiles = Array.from({ length: 8 }, () => Array(8).fill(null));
		tiles[3][5] = 4;
		const board = tileState(tiles, { scores: [2, 0] });
		const next = doAction(board, { type: "move", from: { row: 3, col: 3 }, to: { row: 3, col: 5 } });
		expect(next.result).toEqual({ winner: 0, reason: "all_tiles_scored" });
		expect(getResult(next)).toEqual([1, 0]);
	});

	it("copies tile, marker, score, and history state", () => {
		const board = new Board(stateWith({ phase: "regular" }));
		const copy = board.copy();
		copy.getState().tiles[3][3] = 5;
		copy.getState().scores[0] = 8;
		expect(board.getState().tiles[3][3]).toBeNull();
		expect(board.getState().scores[0]).toBe(0);
	});
});
