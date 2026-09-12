// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
// SPDX-License-Identifier: MIT

export const COLUMNS = 8;
export const ROWS = 8;
export const EMPTY = null;
export const HORIZONTAL = "horizontal";
export const VERTICAL = "vertical";

export const playerIndicator = (roles, playerTypes, player) => {
	const isHorizontal = roles?.[player] === HORIZONTAL;
	const icon = playerTypes?.[player] === "AI" ? "🤖" : "🧑";
	return `${icon}${isHorizontal ? "▼" : "▲"}`;
};
export const PLAYERS = Object.freeze({ HUMAN: "Human", AI: "AI" });
