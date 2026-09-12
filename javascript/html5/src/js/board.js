// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

export const ROWS = 8;
export const COLUMNS = 8;

const valuesFromDice = () =>
	Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 - 4;

const cloneTiles = (tiles) => tiles.map((row) => [...row]);
const samePos = (a, b) =>
	!!a && !!b && a.row === b.row && a.col === b.col;
const allFields = () =>
	Array.from({ length: ROWS * COLUMNS }, (_, index) => ({
		row: Math.floor(index / COLUMNS),
		col: index % COLUMNS,
	}));
const remainingTiles = (tiles) =>
	tiles.flat().filter((value) => value !== null).length;
const hasTileOnAxis = (state, role) => {
	if (!state.marker) return false;
	return role === "horizontal"
		? state.tiles[state.marker.row].some((value) => value !== null)
		: state.tiles.some((row) => row[state.marker.col] !== null);
};
const roleForPlayer = (state, player) => state.roles[player];

const scoreWinner = (scores) => {
	if (scores[0] === scores[1]) return null;
	return scores[0] > scores[1] ? 0 : 1;
};

const finishIfNeeded = (state) => {
	if (remainingTiles(state.tiles) === 0) {
		return {
			...state,
			result: { winner: scoreWinner(state.scores), reason: "all_tiles_scored" },
		};
	}
	if (!hasTileOnAxis(state, roleForPlayer(state, state.active))) {
		return {
			...state,
			result: {
				winner: scoreWinner(state.scores),
				reason: "no_move_available",
			},
		};
	}
	return state;
};

export const createBoard = () => {
	const tiles = Array.from({ length: ROWS }, () =>
		Array.from({ length: COLUMNS }, valuesFromDice),
	);
	const startingPlayer = Math.random() < 0.5 ? 0 : 1;
	const roles = Math.random() < 0.5
		? ["horizontal", "vertical"]
		: ["vertical", "horizontal"];
	return {
		active: startingPlayer,
		tiles,
		marker: null,
		roles,
		playerTypes: ["Human", "Human"],
		scores: [0, 0],
		phase: "opening",
		opening: null,
		latestMove: null,
		moveHistory: [],
		result: null,
	};
};

const openingActions = (state) =>
	allFields()
		.filter(({ row, col }) => state.tiles[row][col] !== null)
		.map((to) => ({ type: "place", to, value: state.tiles[to.row][to.col] }));

const allocationActions = () => [0, 1].map((recipient) => ({
	type: "allocate",
	recipient,
}));

const moveActions = (state) => {
	if (!state.marker) return [];
	const destinations = [];
	for (let index = 0; index < 8; index += 1) {
		const row = state.roles[state.active] === "horizontal" ? state.marker.row : index;
		const col = state.roles[state.active] === "horizontal" ? index : state.marker.col;
		if (state.tiles[row][col] !== null) {
			destinations.push({
				type: "move",
				from: { ...state.marker },
				to: { row, col },
				value: state.tiles[row][col],
			});
		}
	}
	return destinations;
};

export const getActions = (board) => {
	if (!board || board.result) return [];
	if (board.phase === "opening") return openingActions(board);
	if (board.phase === "allocate") return allocationActions();
	return moveActions(board);
};

const matchesAction = (candidate, action) => {
	if (!action || candidate.type !== action.type) return false;
	if (candidate.type === "allocate") return candidate.recipient === action.recipient;
	return samePos(candidate.to, action.to) &&
		(candidate.type === "place" || samePos(candidate.from, action.from));
};

export const doAction = (board, action) => {
	const selected = getActions(board).find((candidate) =>
		matchesAction(candidate, action),
	);
	if (!selected) return board;

	if (selected.type === "place") {
		const tiles = cloneTiles(board.tiles);
		const value = tiles[selected.to.row][selected.to.col];
		tiles[selected.to.row][selected.to.col] = null;
		return {
			...board,
			tiles,
			marker: { ...selected.to },
			phase: "allocate",
			active: 1 - board.active,
			opening: { player: board.active, field: { ...selected.to }, value },
			latestMove: { to: { ...selected.to }, value, player: board.active },
		};
	}

	if (selected.type === "allocate") {
		const scores = [...board.scores];
		scores[selected.recipient] += board.opening.value;
		const next = {
			...board,
			scores,
			phase: "regular",
			active: 1 - selected.recipient,
			opening: { ...board.opening, recipient: selected.recipient },
			moveHistory: [
				...board.moveHistory,
				{
					type: "opening",
					...board.opening,
					recipient: selected.recipient,
					roles: [...board.roles],
					playerTypes: [...board.playerTypes],
				},
			],
		};
		return finishIfNeeded(next);
	}

	const tiles = cloneTiles(board.tiles);
	const value = tiles[selected.to.row][selected.to.col];
	tiles[selected.to.row][selected.to.col] = null;
	const scores = [...board.scores];
	scores[board.active] += value;
	const next = {
		...board,
		tiles,
		marker: { ...selected.to },
		scores,
		active: 1 - board.active,
		latestMove: {
			from: { ...selected.from },
			to: { ...selected.to },
			value,
			player: board.active,
		},
		moveHistory: [
			...board.moveHistory,
			{
				type: "move",
				player: board.active,
				...selected,
				value,
				roles: [...board.roles],
				playerTypes: [...board.playerTypes],
			},
		],
	};
	return finishIfNeeded(next);
};

export const getResult = (board) => {
	if (!board.result) return [0.01, 0.01];
	if (board.result.winner === null) return [0.5, 0.5];
	return board.result.winner === 0 ? [1, 0] : [0, 1];
};

export class Board {
	constructor(state) {
		this._state = state ?? createBoard();
	}

	get active() {
		return this._state.active;
	}

	getActions() {
		return getActions(this._state);
	}

	getResult() {
		return getResult(this._state);
	}

	doAction(action) {
		this._state = doAction(this._state, action);
	}

	copy() {
		return new Board({
			...this._state,
			tiles: cloneTiles(this._state.tiles),
			marker: this._state.marker ? { ...this._state.marker } : null,
			roles: [...this._state.roles],
			playerTypes: [...this._state.playerTypes],
			scores: [...this._state.scores],
			opening: this._state.opening
				? { ...this._state.opening, field: { ...this._state.opening.field } }
				: null,
			latestMove: this._state.latestMove
				? {
						...this._state.latestMove,
						from: this._state.latestMove.from
							? { ...this._state.latestMove.from }
							: undefined,
						to: { ...this._state.latestMove.to },
				  }
				: null,
			moveHistory: this._state.moveHistory.map((entry) => ({
				...entry,
				from: entry.from ? { ...entry.from } : undefined,
				to: entry.to ? { ...entry.to } : undefined,
				field: entry.field ? { ...entry.field } : undefined,
			})),
		});
	}

	getState() {
		return this._state;
	}

	setState(state) {
		this._state = state;
	}
}
