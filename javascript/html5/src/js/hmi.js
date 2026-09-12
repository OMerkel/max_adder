//
// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
// SPDX-License-Identifier: MIT
//
// Human-Machine Interface – main application entry point.
// Wires the reactive store, the SVG renderer, and the AI Web Worker together.
//

import { getActions } from "./board.js";
import { playerIndicator } from "./common.js";
import { createRenderer } from "./renderer.js";
import { Actions, appReducer, createStore, initialAppState } from "./store.js";

// ---------------------------------------------------------------------------
// Reactive store
// ---------------------------------------------------------------------------

const store = createStore(appReducer, initialAppState);

// ---------------------------------------------------------------------------
// Navigation helpers – show/hide named <section> elements
// ---------------------------------------------------------------------------

const sections = ["game", "rules", "options", "about"];

const showView = (view) => {
	sections.forEach((id) => {
		const el = document.getElementById(`view-${id}`);
		if (el) el.hidden = id !== view;
	});
	document.getElementById("app-header-title").textContent =
		view === "game"
			? "Max Adder"
			: view.charAt(0).toUpperCase() + view.slice(1);
};

const updateActivePlayerBadge = (board, settings) => {
	const badge = document.getElementById("app-header-badge");
	const scoreBadge = document.getElementById("app-score-badge");
	if (!badge || !scoreBadge) return;
	const activePlayer = board?.active ?? 0;
	const playerTypes = [settings.playerHorizontal, settings.playerVertical];
	const scores = board?.scores ?? [0, 0];
	const role = board?.roles?.[activePlayer] ?? "horizontal";
	const isHorizontal = role === "horizontal";
	const side = isHorizontal ? "South" : "North";
	const playerType = isHorizontal
		? settings.playerHorizontal
		: settings.playerVertical;
	badge.textContent = playerIndicator(
		board?.roles,
		playerTypes,
		activePlayer,
	);
	const descriptor = `${playerType === "AI" ? "AI" : "human"} player ${side}`;
	badge.setAttribute(
		"aria-label",
		`Active ${descriptor}`,
	);
	const firstIndicator = playerIndicator(board?.roles, playerTypes, 0);
	const secondIndicator = playerIndicator(board?.roles, playerTypes, 1);
	scoreBadge.textContent = `${firstIndicator}${scores[0]} - ${scores[1]}${secondIndicator}`;
	scoreBadge.setAttribute(
		"aria-label",
		`Scores: ${scores[0]} to ${scores[1]}`,
	);
};

const detectAutoDeviceProfile = () => {
	const smallViewport = (window.innerWidth || 1200) <= 900;
	const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
	return smallViewport || coarsePointer ? "Mobile" : "Desktop";
};

const updateAutoProfileHint = () => {
	const hint = document.getElementById("device-profile-hint");
	if (!hint) return;
	const resolved = detectAutoDeviceProfile();
	hint.textContent = `Auto currently resolves to ${resolved}.`;
};

const updateOpeningChoice = (board, settings) => {
	const panel = document.getElementById("opening-choice");
	if (!panel) return;
	panel.hidden = board?.phase !== "allocate";
	if (panel.hidden || !board?.opening) return;
	const playerTypes = board.playerTypes ?? [
		settings.playerHorizontal,
		settings.playerVertical,
	];
	const placer = board.opening.player;
	const decider = 1 - placer;
	document.getElementById("opening-assign-placer").textContent =
		`Give opening score to${playerIndicator(board.roles, playerTypes, placer)}`;
	document.getElementById("opening-assign-decider").textContent =
		`Give opening score to${playerIndicator(board.roles, playerTypes, decider)}`;
};

// ---------------------------------------------------------------------------
// Settings read from the options form
// ---------------------------------------------------------------------------

const readSettings = () => ({
	playerhorizontal:
		document.querySelector('input[name="horizontalplayer"]:checked')?.value ??
		"Human",
	playervertical:
		document.querySelector('input[name="verticalplayer"]:checked')?.value ??
		"Human",
	difficultyhorizontal:
		document.querySelector('input[name="difficultyhorizontal"]:checked')?.value ??
		"Medium",
	difficultyvertical:
		document.querySelector('input[name="difficultyvertical"]:checked')?.value ??
		"Medium",
	deviceprofile:
		document.querySelector('input[name="deviceprofile"]:checked')?.value ??
		"Auto",
	resolveddeviceprofile: (() => {
		const selected =
			document.querySelector('input[name="deviceprofile"]:checked')?.value ??
			"Auto";
		return selected === "Auto" ? detectAutoDeviceProfile() : selected;
	})(),
});

// ---------------------------------------------------------------------------
// Worker bootstrap
// ---------------------------------------------------------------------------

const engine = new Worker("js/controller.js", { type: "module" });

const sendToEngine = (request, extra = {}) => {
	engine.postMessage({
		class: "request",
		request,
		settings: readSettings(),
		...extra,
	});
};

// ---------------------------------------------------------------------------
// SVG renderer bootstrap
// ---------------------------------------------------------------------------

let renderer = null;
let selectedCell = null;
let aiMoveTimer = null;

const samePos = (a, b) => !!a && !!b && a.row === b.row && a.col === b.col;

const handleCellClick = (cell) => {
	const state = store.getState();
	if (state.phase !== "human_turn") return;

	const actions = state.selectableActions;
	if (actions.length === 0) return;

	const chosen = actions.find((action) => samePos(action.to, cell));

	if (chosen) {
		selectedCell = null;
		sendToEngine("move", { action: chosen });
		return;
	}

	selectedCell = null;
};

// ---------------------------------------------------------------------------
// Worker → store: translate engine messages to store actions
// ---------------------------------------------------------------------------

engine.addEventListener("message", ({ data }) => {
	switch (data.request) {
		case "redraw":
			store.dispatch({ type: Actions.ENGINE_BOARD_UPDATE, board: data.board });
			break;

		case "human_to_move": {
			if (aiMoveTimer !== null) {
				clearTimeout(aiMoveTimer);
				aiMoveTimer = null;
			}
			const selectable = data.board ? getActions(data.board) : [];
			selectedCell = null;
			store.dispatch({
				type: Actions.HUMAN_TURN_READY,
				board: data.board,
				selectableActions: selectable,
			});
			break;
		}

		case "ai_to_move":
			selectedCell = null;
			store.dispatch({ type: Actions.AI_THINKING });
			if (aiMoveTimer !== null) clearTimeout(aiMoveTimer);
			aiMoveTimer = setTimeout(() => {
				aiMoveTimer = null;
				sendToEngine("action_by_ai");
			}, 1000);
			break;

		default:
			break;
	}
});

// ---------------------------------------------------------------------------
// Store → renderer: re-render on every state change
// ---------------------------------------------------------------------------

store.subscribe((state) => {
	showView(state.view);
	updateActivePlayerBadge(state.board, state.settings);
	updateOpeningChoice(state.board, state.settings);

	if (renderer && state.board) {
		if (state.phase !== "human_turn") selectedCell = null;
		renderer.render(state.board, state.selectableActions, selectedCell);
	}

	// Reflect AI-thinking in the title bar.
	if (state.phase === "ai_thinking") {
		document.getElementById("app-header-title").textContent = "AI thinking...";
	}
});

// ---------------------------------------------------------------------------
// DOM event wiring (called once after DOMContentLoaded)
// ---------------------------------------------------------------------------

const wireUI = () => {
	// Renderer
	const boardContainer = document.getElementById("board");
	renderer = createRenderer(boardContainer, handleCellClick);

	// Menu panel toggle
	const panel = document.getElementById("side-panel");
	const menuBtn = document.getElementById("btn-menu");
	const closeBtn = document.getElementById("btn-panel-close");
	const overlay = document.getElementById("panel-overlay");
	const chooseOpeningRecipient = (recipient) => {
		if (store.getState().board?.phase !== "allocate") return;
		sendToEngine("move", { action: { type: "allocate", recipient } });
	};
	document.getElementById("opening-assign-placer")?.addEventListener("click", () => {
		chooseOpeningRecipient(store.getState().board.opening.player);
	});
	document.getElementById("opening-assign-decider")?.addEventListener("click", () => {
		chooseOpeningRecipient(1 - store.getState().board.opening.player);
	});

	const openPanel = () => {
		panel.classList.add("open");
		overlay.hidden = false;
	};
	const closePanel = () => {
		panel.classList.remove("open");
		overlay.hidden = true;
	};
	const navigateToGame = () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "game" });
	};
	const applySettingsFromOptions = () => {
		const s = readSettings();
		store.dispatch({
			type: Actions.SETTINGS_CHANGE,
			settings: {
				playerHorizontal: s.playerhorizontal,
				playerVertical: s.playervertical,
				difficultyHorizontal: s.difficultyhorizontal,
				difficultyVertical: s.difficultyvertical,
				deviceProfile: s.deviceprofile,
				resolvedDeviceProfile: s.resolveddeviceprofile,
			},
		});
		sendToEngine("sync");
	};
	const closePanelAndReturnToGame = () => {
		const currentView = store.getState().view;
		if (currentView === "options") {
			applySettingsFromOptions();
		}
		navigateToGame();
	};

	menuBtn?.addEventListener("click", openPanel);
	closeBtn?.addEventListener("click", closePanelAndReturnToGame);
	overlay?.addEventListener("click", closePanelAndReturnToGame);

	// Navigation links
	document.getElementById("nav-new")?.addEventListener("click", () => {
		if (store.getState().view === "options") {
			applySettingsFromOptions();
		}
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "game" });
		store.dispatch({ type: Actions.NEW_GAME });
		sendToEngine("restart");
	});

	const navTo = (view) => () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view });
	};
	document
		.getElementById("nav-rules")
		?.addEventListener("click", navTo("rules"));
	document.getElementById("nav-options")?.addEventListener("click", () => {
		navTo("options")();
		updateAutoProfileHint();
	});
	document
		.getElementById("nav-about")
		?.addEventListener("click", navTo("about"));

	// Back buttons inside sub-views
	document.querySelectorAll(".btn-back").forEach((btn) => {
		btn.addEventListener("click", navigateToGame);
	});

	// Options "OK" – sync settings then dismiss
	document.getElementById("btn-options-ok")?.addEventListener("click", () => {
		applySettingsFromOptions();
		navigateToGame();
	});

	document.querySelectorAll('input[name="deviceprofile"]').forEach((input) => {
		input.addEventListener("change", updateAutoProfileHint);
	});

	window.addEventListener("resize", updateAutoProfileHint);

	const initialSettings = readSettings();
	store.dispatch({
		type: Actions.SETTINGS_CHANGE,
		settings: {
			playerHorizontal: initialSettings.playerhorizontal,
			playerVertical: initialSettings.playervertical,
			difficultyHorizontal: initialSettings.difficultyhorizontal,
			difficultyVertical: initialSettings.difficultyvertical,
			deviceProfile: initialSettings.deviceprofile,
			resolvedDeviceProfile: initialSettings.resolveddeviceprofile,
		},
	});

	updateAutoProfileHint();

	// Kick off a new game
	sendToEngine("start");
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", wireUI);
} else {
	wireUI();
}
