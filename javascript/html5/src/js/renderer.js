// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

import { playerIndicator } from "./common.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const ROWS = 8;
const COLUMNS = 8;
const VB_W = 800;
const VB_H = 860;
const CELL = 90;
const OFFSET_X = 40;
const OFFSET_Y = 90;
const TILE_FONT_MIN = 20;
const TILE_FONT_MAX = 40;

const colors = {
	light: "#f2e8cf",
	dark: "#2f6f3e",
	selected: "#93c5fd",
	destination: "#bfdbfe",
	latest: "#f59e0b",
	marker: "#111827",
	text: "#111827",
};

const svgEl = (tag, attrs = {}) => {
	const el = document.createElementNS(SVG_NS, tag);
	Object.entries(attrs).forEach(([key, value]) => {
		el.setAttribute(key, String(value));
	});
	return el;
};

const cellCenter = (row, col) => ({
	x: OFFSET_X + col * CELL + CELL / 2,
	y: OFFSET_Y + row * CELL + CELL / 2,
});
const keyOf = (row, col) => `${row}:${col}`;
const samePos = (a, b) => !!a && !!b && a.row === b.row && a.col === b.col;
const tileFontSize = (value) => {
	const midpoint = (-2 + 8) / 2;
	const maximumDistance = Math.abs(8 - midpoint);
	const distance = Math.abs(value - midpoint);
	return Math.round(
		TILE_FONT_MIN +
			(distance / maximumDistance) * (TILE_FONT_MAX - TILE_FONT_MIN),
	);
};

const annotationText = (text, x, y, transform = null) => {
	const annotation = svgEl("text", {
		x,
		y,
		"text-anchor": "middle",
		"dominant-baseline": "middle",
		class: "board-annotation",
	});
	if (transform) annotation.setAttribute("transform", transform);
	annotation.textContent = text;
	return annotation;
};

export const createRenderer = (container, onCellClick) => {
	const svg = svgEl("svg", {
		viewBox: `0 0 ${VB_W} ${VB_H}`,
		preserveAspectRatio: "xMidYMid meet",
		role: "img",
		"aria-label": "Max Adder board",
	});
	svg.style.cssText = "display:block;width:100%;height:100%;";
	svg.appendChild(svgEl("rect", {
		x: 0, y: 0, width: VB_W, height: VB_H, fill: "#0f172a", rx: 16, ry: 16,
	}));
	svg.appendChild(svgEl("rect", {
		x: OFFSET_X - 10, y: OFFSET_Y - 10,
		width: COLUMNS * CELL + 20, height: ROWS * CELL + 20,
		fill: "#f2e8cf", stroke: "#166534", "stroke-width": 4, rx: 8, ry: 8,
	}));

	const statusBackground = svgEl("rect", {
		x: 90,
		y: 14,
		width: VB_W - 180,
		height: 52,
		rx: 12,
		ry: 12,
		fill: "#1e293b",
		stroke: "#334155",
		"stroke-width": 2,
	});
	svg.appendChild(statusBackground);

	const statusText = svgEl("text", {
		x: VB_W / 2, y: 50, "text-anchor": "middle",
		style: "font:700 28px/1 system-ui,sans-serif;fill:#e2e8f0;",
		id: "board-status",
	});
	svg.appendChild(statusText);

	const annotations = svgEl("g", { "aria-hidden": "true", class: "board-annotations" });
	"abcdefgh".split("").forEach((file, col) => {
		const x = cellCenter(ROWS - 1, col).x;
		annotations.appendChild(annotationText(file, x, OFFSET_Y + ROWS * CELL + 28));
		annotations.appendChild(annotationText(file, x, OFFSET_Y - 28, `rotate(180 ${x} ${OFFSET_Y - 28})`));
	});
	for (let rank = 1; rank <= ROWS; rank += 1) {
		const y = cellCenter(ROWS - rank, 0).y;
		annotations.appendChild(annotationText(String(rank), OFFSET_X - 24, y));
		annotations.appendChild(annotationText(String(rank), OFFSET_X + COLUMNS * CELL + 24, y, `rotate(180 ${OFFSET_X + COLUMNS * CELL + 24} ${y})`));
	}
	svg.appendChild(annotations);

	const cellRects = Array.from({ length: ROWS }, (_, row) =>
		Array.from({ length: COLUMNS }, (_, col) => {
			const rect = svgEl("rect", {
				x: OFFSET_X + col * CELL, y: OFFSET_Y + row * CELL,
				width: CELL, height: CELL,
				fill: (row + col) % 2 === 0 ? colors.light : colors.dark,
			});
			svg.appendChild(rect);
			return rect;
		}),
	);
	const tileLayer = svgEl("g", { "aria-hidden": "true" });
	const markerLayer = svgEl("g", { "aria-hidden": "true" });
	svg.appendChild(tileLayer);
	svg.appendChild(markerLayer);
	const overlays = Array.from({ length: ROWS }, (_, row) =>
		Array.from({ length: COLUMNS }, (_, col) => {
			const rect = svgEl("rect", {
				x: OFFSET_X + col * CELL, y: OFFSET_Y + row * CELL,
				width: CELL, height: CELL, fill: "#ffffff", opacity: 0,
			});
			rect.dataset.row = String(row);
			rect.dataset.col = String(col);
			rect.style.cursor = "default";
			svg.appendChild(rect);
			return rect;
		}),
	);
	container.appendChild(svg);

	const handlers = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));
	const clearHandlers = () => {
		overlays.forEach((row, r) => {
		row.forEach((overlay, c) => {
			if (handlers[r][c]) overlay.removeEventListener("click", handlers[r][c]);
			handlers[r][c] = null;
			overlay.style.cursor = "default";
			overlay.setAttribute("opacity", "0");
		});
	});
	};

	const render = (boardState, selectableActions = [], selectedCell = null) => {
		const destinations = new Set(selectableActions.filter((action) => action.to).map((action) => keyOf(action.to.row, action.to.col)));
		const latestTarget = boardState.latestMove?.to ?? null;
		cellRects.forEach((row, r) => {
			row.forEach((cell, c) => {
				const key = keyOf(r, c);
				const base = (r + c) % 2 === 0 ? colors.light : colors.dark;
				const fill = samePos(selectedCell, { row: r, col: c })
					? colors.selected : destinations.has(key) ? colors.destination : base;
				cell.setAttribute("fill", fill);
				cell.setAttribute("stroke", samePos(latestTarget, { row: r, col: c }) ? colors.latest : "none");
				cell.setAttribute("stroke-width", samePos(latestTarget, { row: r, col: c }) ? "5" : "0");
			});
		});

		while (tileLayer.firstChild) tileLayer.removeChild(tileLayer.firstChild);
		boardState.tiles.forEach((row, r) => {
			row.forEach((value, c) => {
				if (value === null) return;
				const center = cellCenter(r, c);
				const text = svgEl("text", {
					x: center.x, y: center.y, "text-anchor": "middle",
					"dominant-baseline": "middle", fill: colors.text,
					style: `font:700 ${tileFontSize(value)}px/1 system-ui,sans-serif;`,
				});
				text.textContent = String(value);
				text.dataset.row = String(r);
				text.dataset.col = String(c);
				tileLayer.appendChild(text);
			});
		});

		while (markerLayer.firstChild) markerLayer.removeChild(markerLayer.firstChild);
		if (boardState.marker) {
			const center = cellCenter(boardState.marker.row, boardState.marker.col);
			markerLayer.appendChild(svgEl("circle", {
				cx: center.x, cy: center.y, r: 30, fill: "none",
				stroke: colors.marker, "stroke-width": 8,
			}));
		}

		if (boardState.result) {
			statusText.textContent = boardState.result.winner === null
				? "Draw"
				: `Player ${playerIndicator(boardState.roles, boardState.playerTypes, boardState.result.winner)} wins!`;
		} else if (boardState.phase === "opening") {
			statusText.textContent = `${playerIndicator(boardState.roles, boardState.playerTypes, boardState.active)}: place marker`;
		} else if (boardState.phase === "allocate") {
			statusText.textContent = `${playerIndicator(boardState.roles, boardState.playerTypes, boardState.active)}: choose who receives the opening score`;
		} else {
			statusText.textContent = `${playerIndicator(boardState.roles, boardState.playerTypes, boardState.active)}: select a field`;
		}

		clearHandlers();
		destinations.forEach((key) => {
			const [row, col] = key.split(":").map(Number);
			const click = () => onCellClick({ row, col });
			handlers[row][col] = click;
			overlays[row][col].addEventListener("click", click);
			overlays[row][col].style.cursor = "pointer";
			overlays[row][col].setAttribute("opacity", "0.12");
		});
	};

	return { render, flashSowing: () => {}, resize: () => {} };
};
